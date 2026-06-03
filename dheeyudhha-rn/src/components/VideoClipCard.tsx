import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, Dimensions,
  StyleSheet,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Heart, MessageCircle, User, Volume2, VolumeX, Play } from 'lucide-react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  post: any;
  isActive: boolean;           // only the visible card plays
  currentUserId: string | null;
  onLike: (postId: string) => void;
  onCommentPress: (postId: string) => void;
  onAuthorPress: (username: string) => void;
}

export default function VideoClipCard({
  post, isActive, currentUserId, onLike, onCommentPress, onAuthorPress,
}: Props) {
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(post.is_liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [manualPaused, setManualPaused] = useState(false);

  const player = useVideoPlayer(post.video_url, (p) => {
    p.loop = true;
    p.muted = false;
    // Do NOT auto-play here — wait for isActive
  });

  // ── Critical fix: useLayoutEffect fires synchronously before paint ────────
  // This ensures the player is IMMEDIATELY paused as soon as the card leaves
  // the viewport, eliminating audio bleeding between clips.
  useLayoutEffect(() => {
    if (!player) return;
    if (isActive && !manualPaused) {
      // Small delay so the FlatList snap settles before playing
      const t = setTimeout(() => {
        try { player.play(); } catch (e) {}
      }, 50);
      return () => clearTimeout(t);
    } else {
      // Pause & mute instantly — no setTimeout — kills audio immediately
      try {
        player.pause();
        // Reset to start so next view starts fresh — use seekTo(), currentTime is read-only
        if (!isActive) {
          player.seekTo(0);
        }
      } catch (e) {}
    }
  }, [isActive, manualPaused, player]);

  // Sync mute immediately (also stops audio bleed on mute toggle)
  useLayoutEffect(() => {
    if (player) {
      try { player.muted = muted; } catch (e) {}
    }
  }, [muted, player]);

  // Pause player on unmount (safety net)
  useEffect(() => {
    return () => {
      try { player.pause(); } catch (e) {}
    };
  }, [player]);

  const handleLike = () => {
    setLiked((v: boolean) => !v);
    setLikesCount((c: number) => liked ? c - 1 : c + 1);
    onLike(post.id);
  };

  const togglePlayPause = () => {
    setManualPaused(v => !v);
  };

  const authorName = post.author?.name || 'Scholar';
  const authorUsername = post.author?.username;
  const avatarUrl = post.author?.avatar_url;

  return (
    <View style={styles.container}>
      {/* Video — tap to pause/play */}
      <TouchableOpacity activeOpacity={1} onPress={togglePlayPause} style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      </TouchableOpacity>

      {/* Bottom gradient scrim */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* Pause icon overlay */}
      {(manualPaused || !isActive) && isActive && (
        <View style={styles.pauseOverlay} pointerEvents="none">
          <Play size={52} color="white" fill="white" />
        </View>
      )}

      {/* Mute toggle — top right */}
      <TouchableOpacity style={styles.muteBtn} onPress={() => setMuted(v => !v)}>
        {muted
          ? <VolumeX size={20} color="white" />
          : <Volume2 size={20} color="white" />}
      </TouchableOpacity>

      {/* Right sidebar */}
      <View style={styles.sidebar}>
        {/* Like */}
        <TouchableOpacity style={styles.sideAction} onPress={handleLike}>
          <Heart
            size={30}
            color={liked ? '#ef4444' : 'white'}
            fill={liked ? '#ef4444' : 'transparent'}
          />
          <Text style={styles.sideLabel}>{likesCount}</Text>
        </TouchableOpacity>

        {/* Comments */}
        <TouchableOpacity style={styles.sideAction} onPress={() => onCommentPress(post.id)}>
          <MessageCircle size={30} color="white" />
          <Text style={styles.sideLabel}>{post.comments_count || 0}</Text>
        </TouchableOpacity>

        {/* Author avatar */}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => authorUsername && onAuthorPress(authorUsername)}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User size={18} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom caption */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity onPress={() => authorUsername && onAuthorPress(authorUsername)}>
          <Text style={styles.authorName}>@{authorUsername || authorName}</Text>
        </TouchableOpacity>
        {post.content ? (
          <Text style={styles.caption} numberOfLines={2}>{post.content}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#000',
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    // Multi-stop gradient scrim via two overlapping views
    backgroundColor: 'transparent',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtn: {
    position: 'absolute',
    top: 56,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebar: {
    position: 'absolute',
    right: 12,
    bottom: 110,
    alignItems: 'center',
    gap: 20,
  },
  sideAction: { alignItems: 'center', gap: 4 },
  sideLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  avatarBtn: { marginTop: 4 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 80,
    left: 14,
    right: 76,
  },
  authorName: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  caption: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
