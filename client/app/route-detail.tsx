import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Linking, StyleSheet, TextInput, ScrollView, Alert, RefreshControl, Image, Modal, Dimensions, Pressable } from 'react-native';
import { TAGS as ALL_TAGS, SURFACE_OPTIONS, TRAFFIC_OPTIONS } from './constants';

export default function RouteDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [route, setRoute] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentSort, setCommentSort] = useState<'recent' | 'likes'>('recent');
  const [commentInput, setCommentInput] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [me, setMe] = useState<any | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
  const serverBase = api.replace(/\/?api\/?$/, '');
  const [liked, setLiked] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<{id:number;url:string;created_at?:string}[]>([]);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'route' | 'comment'; id: number | null }>({ type: 'route', id: null });
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState('');

  const REPORT_REASONS = ['스팸', '욕설/혐오', '불법/위험', '부적절한 내용', '기타'];

  const loadRoute = useCallback(async () => {
    setIsLoadingRoute(true);
    try {
      const r = await fetch(`${api}/routes/${id}`);
      const data = await r.json();
      setRoute(data);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [api, id]);

  const loadComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const r = await fetch(`${api}/comments/route/${id}?sort=${commentSort}`);
      const data = await r.json();
      setComments(data);
    } finally {
      setIsLoadingComments(false);
    }
  }, [api, id, commentSort]);

  const loadPhotos = useCallback(async () => {
    try {
      const r = await fetch(`${api}/routes/${id}/photos`);
      const data = await r.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch {}
  }, [api, id]);

  useEffect(() => {
    loadRoute();
    loadComments();
    loadPhotos();
    fetch(`${api}/auth/me`, { credentials: 'include' }).then(async (r)=>{ if (r.ok) setMe(await r.json()); else setMe(null); }).catch(()=>{});
    fetch(`${api}/routes/${id}/liked`, { credentials: 'include' }).then(async (r)=>{
      if (r.ok) { const d = await r.json(); setLiked(!!d.liked); }
      else setLiked(false);
    }).catch(()=> setLiked(false));
  }, [api, id, loadRoute, loadComments, loadPhotos]);

  const resolveImageUrl = useCallback((u: string) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    return `${serverBase}${u.startsWith('/') ? '' : '/'}${u}`;
  }, [serverBase]);

  const openNaver = async () => {
    if (!route) return;
    const url = route.nmap_url || route.open_url;
    if (Platform.OS === 'web') {
      // On Android web, prefer intent://; for simplicity, use open_url directly
      window.location.href = url;
    } else {
      await Linking.openURL(url);
    }
    const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
    fetch(`${api}/routes/${route.id}/open-track`, { method: 'POST' });
  };

  const toggleLike = async () => {
    if (!route) return;
    if (liked === null) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setRoute({ ...route, like_count: Math.max(0, (route.like_count || 0) + (nextLiked ? 1 : -1)) });
    const endpoint = nextLiked ? 'like' : 'unlike';
    const res = await fetch(`${api}/routes/${route.id}/${endpoint}`, { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      setLiked(liked);
      setRoute(route);
      if (res.status === 401) Alert.alert('로그인이 필요합니다');
      return;
    }
    const data = await res.json();
    setRoute(data);
  };

  const toggleBookmark = async () => {
    if (!route) return;
    const current = bookmarked;
    const next = !current;
    setBookmarked(next);
    const endpoint = next ? 'POST' : 'DELETE';
    const res = await fetch(`${api}/bookmarks/route/${route.id}`, { method: endpoint, credentials: 'include' });
    if (!res.ok) {
      setBookmarked(current);
      if (res.status === 401) Alert.alert('로그인이 필요합니다');
    }
  };

  const openReportForRoute = () => {
    if (!route) return;
    setReportTarget({ type: 'route', id: route.id });
    setReportReason(null);
    setReportDetail('');
    setShowReportModal(true);
  };

  const openReportForComment = (commentId: number) => {
    setReportTarget({ type: 'comment', id: commentId });
    setReportReason(null);
    setReportDetail('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportTarget.id || !reportReason) {
      Alert.alert('사유를 선택해 주세요');
      return;
    }
    try {
      const url = reportTarget.type === 'route'
        ? `${api}/reports/route/${reportTarget.id}`
        : `${api}/reports/comment/${reportTarget.id}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, detail: reportDetail || null }),
      });
      if (!res.ok) throw new Error('신고에 실패했어요');
      setShowReportModal(false);
      setReportReason(null);
      setReportDetail('');
      Alert.alert('신고가 접수되었습니다. 감사합니다.');
    } catch (e: any) {
      Alert.alert(e?.message || '신고 중 오류가 발생했어요');
    }
  };

  const postComment = async () => {
    if (!route || !commentInput.trim()) return;
    const api = process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:8080/api';
    const res = await fetch(`${api}/comments/route/${route.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ content: commentInput.trim() }) });
    const data = await res.json();
    if (res.ok) {
      setComments([data, ...comments]);
      setCommentInput('');
      setRoute({ ...route, comment_count: (route.comment_count || 0) + 1 });
    }
    if (res.status === 401) Alert.alert('로그인이 필요합니다');
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadRoute(), loadComments(), loadPhotos()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleCommentLike = async (commentId: number) => {
    const idx = comments.findIndex((c) => c.id === commentId);
    if (idx < 0) return;
    const target = comments[idx];
    const currentlyLiked = !!target.liked_by_me;
    const endpoint = currentlyLiked ? 'unlike' : 'like';
    const next = [...comments];
    next[idx] = {
      ...target,
      liked_by_me: !currentlyLiked,
      like_count: Math.max(0, (target.like_count || 0) + (currentlyLiked ? -1 : 1)),
    };
    setComments(next);
    try {
      const res = await fetch(`${api}/comments/${commentId}/${endpoint}`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
    } catch (e) {
      // revert
      setComments((prev) => {
        const copy = [...prev];
        const j = copy.findIndex((c) => c.id === commentId);
        if (j >= 0) copy[j] = target;
        return copy;
      });
      Alert.alert('로그인이 필요합니다');
    }
  };

  const formatRelativeOrDate = useCallback((iso: string) => {
    try {
      const created = new Date(iso).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - created) / 1000));
      if (diffSec < 60) return 'just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
      if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d`;
      const d = new Date(created);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  }, []);

  if (!route) return <View style={{ padding: 16 }}><Text>Loading...</Text></View>;

  const TAGS = ALL_TAGS;
  const tagNames: string[] = [];
  if (typeof route.tags_bitmask === 'number') {
    for (let i=0;i<TAGS.length;i++) if (route.tags_bitmask & (1<<i)) tagNames.push(TAGS[i]);
  }

  const canEdit = !!me && route && route.author_id === me.id;

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      refreshControl={Platform.OS === 'web' ? undefined : (
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      )}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{route.title}</Text>
      {route.summary && <Text>{route.summary}</Text>}
      {route.created_at ? (
        <Text style={{ color: '#6b7280', fontSize: 12 }}>등록: {formatRelativeOrDate(route.created_at)}</Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Text style={styles.metaPill}>❤ {route.like_count}</Text>
        <Text style={styles.metaPill}>💬 {route.comment_count}</Text>
        <TouchableOpacity onPress={toggleLike} style={[styles.smallBtn, liked ? styles.likeBtnActive : styles.likeBtn]}>
          <Text style={[styles.likeBtnText, liked ? { color: '#fff' } : null]}>{liked ? 'Liked' : 'Like'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleBookmark} style={styles.smallBtn}><Text>{bookmarked ? 'Bookmarked' : 'Bookmark'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={openReportForRoute} style={styles.smallBtn}><Text>신고</Text></TouchableOpacity>
        {canEdit ? (
          <TouchableOpacity onPress={() => router.push({ pathname: '/route-edit', params: { id: String(route.id) } })} style={styles.smallBtn}>
            <Text>수정</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {route.stars_scenery ? <Text>경치 {'★'.repeat(route.stars_scenery)}</Text> : null}
          {route.stars_difficulty ? <Text>난이도 {'★'.repeat(route.stars_difficulty)}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {route.surface ? <Text>노면 {labelOf(SURFACE_OPTIONS, route.surface)}</Text> : null}
          {route.traffic ? <Text>교통량 {labelOf(TRAFFIC_OPTIONS, route.traffic)}</Text> : null}
          {typeof route.speedbump === 'number' && route.speedbump > 0 ? <Text>범퍼 {route.speedbump}</Text> : null}
          {typeof route.enforcement === 'number' && route.enforcement > 0 ? <Text>단속 {route.enforcement}</Text> : null}
          {typeof route.signal === 'number' && route.signal > 0 ? <Text>신호 {route.signal}</Text> : null}
        </View>
      </View>
      {photos.length > 0 && (() => {
        const winW = Dimensions.get('window').width || 360;
        const numColumns = Math.max(2, Math.min(4, Math.floor(winW / 260)));
        const itemWidthPct = `${100 / numColumns}%` as const;
        return (
          <View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 8 }}>
              {photos.map((p, idx) => (
                <View key={p.id} style={{ width: itemWidthPct, padding: 4 }}>
                  <TouchableOpacity onPress={() => { setPhotoIndex(idx); setIsPhotoViewerOpen(true); }} activeOpacity={0.9} accessibilityRole="imagebutton" accessibilityLabel={`사진 ${idx + 1} 보기`}>
                    <Image
                      source={{ uri: resolveImageUrl(p.url) }}
                      style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f3f4f6' }}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{photos.length}장의 사진</Text>
          </View>
        );
      })()}
      {tagNames.length>0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {tagNames.map(t => (
            <View key={t} style={{ borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}><Text>{t}</Text></View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>댓글</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={() => setCommentSort('recent')}
              style={[styles.sortPill, commentSort === 'recent' ? styles.sortPillActive : null]}
            >
              <Text style={[styles.sortPillText, commentSort === 'recent' ? { color: '#fff' } : null]}>최신순</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCommentSort('likes')}
              style={[styles.sortPill, commentSort === 'likes' ? styles.sortPillActive : null]}
            >
              <Text style={[styles.sortPillText, commentSort === 'likes' ? { color: '#fff' } : null]}>좋아요순</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <TextInput
            placeholder="댓글 입력"
            value={commentInput}
            onChangeText={setCommentInput}
            style={{ flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderColor: '#ccc' }}
            returnKeyType="send"
            onSubmitEditing={postComment}
          />
          <TouchableOpacity onPress={postComment} disabled={!commentInput.trim()} style={[styles.smallBtn, !commentInput.trim() && { opacity: 0.5 }]}><Text>등록</Text></TouchableOpacity>
        </View>
        {isLoadingComments && comments.length === 0 ? (
          <Text style={{ color: '#6b7280' }}>댓글을 불러오는 중…</Text>
        ) : null}

        {!isLoadingComments && comments.length === 0 ? (
          <Text style={{ color: '#6b7280' }}>아직 댓글이 없어요. 첫 댓글을 남겨보세요!</Text>
        ) : null}

        {comments.map((c)=> (
          <View key={c.id} style={[styles.commentItem, { gap: 8 }]}>
            <TouchableOpacity style={{ flex: 1 }} delayLongPress={250} onLongPress={() => openReportForComment(c.id)}>
              <Text>{c.content}</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.commentTime}>{formatRelativeOrDate(c.created_at)}</Text>
              <TouchableOpacity
                onPress={() => toggleCommentLike(c.id)}
                style={[styles.commentLikeBtn, c.liked_by_me && styles.commentLikeBtnActive]}
                accessibilityRole="button"
                accessibilityLabel="댓글 좋아요"
              >
                <Text style={[{ fontSize: 12 }, c.liked_by_me ? { color: '#fff' } : { color: '#374151' }]}>❤ {c.like_count || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 24 }}>
        <TouchableOpacity onPress={openNaver} style={{ backgroundColor: '#16a34a', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>네이버 지도에서 보기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    <Modal visible={showReportModal} animationType="fade" transparent onRequestClose={() => setShowReportModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>신고 사유 선택</Text>
          <View style={{ gap: 8 }}>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity key={r} style={[styles.reasonItem, reportReason === r && styles.reasonItemSelected]} onPress={() => setReportReason(r)}>
                <Text>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            placeholder="추가 설명 (선택)"
            value={reportDetail}
            onChangeText={setReportDetail}
            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginTop: 10 }}
            multiline
          />
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowReportModal(false)} style={[styles.smallBtn, { flex: 1 }]}>
              <Text>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submitReport} style={[styles.smallBtn, styles.likeBtnActive, { flex: 1 }]}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>신고하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Photo Viewer */}
    <Modal
      visible={isPhotoViewerOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsPhotoViewerOpen(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
        <View style={{ paddingTop: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{`${photoIndex + 1} / ${photos.length}`}</Text>
          <TouchableOpacity onPress={() => setIsPhotoViewerOpen(false)} style={{ padding: 10 }} accessibilityRole="button" accessibilityLabel="닫기">
            <Text style={{ color: '#fff', fontSize: 16 }}>닫기</Text>
          </TouchableOpacity>
        </View>
        <PhotoCarousel
          photos={photos.map(p => resolveImageUrl(p.url))}
          index={photoIndex}
          onIndexChange={setPhotoIndex}
        />
      </View>
    </Modal>
    </View>
  );
}

function labelOf<T extends string>(options: { label: string; value: T }[], v: T | null | undefined): string {
  const found = options.find(o => o.value === v);
  return found ? found.label : '';
}

type PhotoCarouselProps = {
  photos: string[];
  index: number;
  onIndexChange: (next: number) => void;
};

function PhotoCarousel({ photos, index, onIndexChange }: PhotoCarouselProps) {
  const { width, height } = Dimensions.get('window');
  const viewerHeight = height * 0.8;
  const initialX = Math.max(0, Math.min(index, Math.max(0, photos.length - 1))) * width;
  let scrollRef: any;

  return (
    <ScrollView
      ref={(r) => { scrollRef = r; }}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: initialX, y: 0 }}
      onMomentumScrollEnd={(e) => {
        const next = Math.round(e.nativeEvent.contentOffset.x / width);
        if (next !== index) onIndexChange(next);
      }}
      style={{ flex: 1 }}
    >
      {photos.map((uri, i) => (
        <View key={`${uri}-${i}`} style={{ width, height: viewerHeight, justifyContent: 'center', alignItems: 'center' }}>
          {Platform.OS === 'ios' ? (
            <ScrollView
              style={{ width, height: viewerHeight }}
              contentContainerStyle={{ width, height: viewerHeight, justifyContent: 'center', alignItems: 'center' }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              bouncesZoom
              centerContent
            >
              <Image source={{ uri }} style={{ width, height: viewerHeight, resizeMode: 'contain' }} />
            </ScrollView>
          ) : (
            <ZoomableImage uri={uri} width={width} height={viewerHeight} />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

type ZoomableImageProps = { uri: string; width: number; height: number };

function ZoomableImage({ uri, width, height }: ZoomableImageProps) {
  const [scale, setScale] = useState(1);
  const [lastTap, setLastTap] = useState<number>(0);
  const onPress = () => {
    const now = Date.now();
    if (now - lastTap < 250) {
      setScale((s) => (s > 1 ? 1 : 2));
    }
    setLastTap(now);
  };
  return (
    <Pressable onPress={onPress} style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <Image source={{ uri }} style={{ width, height, resizeMode: 'contain', transform: [{ scale }] }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  smallBtn: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  likeBtn: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
  likeBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  likeBtnText: { color: '#111827', fontWeight: '600' },
  metaPill: { fontSize: 12, color: '#374151', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f3f4f6', borderRadius: 999 },
  commentItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  commentTime: { color: '#94a3b8', fontSize: 12, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', width: '100%', maxWidth: 420, borderRadius: 12, padding: 16, gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  reasonItem: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10 },
  reasonItemSelected: { borderColor: '#111827', backgroundColor: '#f3f4f6' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  sortPill: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff' },
  sortPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  sortPillText: { fontSize: 12, color: '#111827' },
  commentLikeBtn: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fff' },
  commentLikeBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
});

