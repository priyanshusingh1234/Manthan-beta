"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js'
import { Trophy, Target, Award, Zap, BookOpen, Users, TrendingUp, Star, Medal, Brain, Sword, Shield } from 'lucide-react';
// Logo not required on profile page
import Image from 'next/image'

/**
 * StudentProfile component - Responsive profile page for students
 * Shows user information, achievements, and statistics
 */
const StudentProfile: React.FC = () => {
  const [userData, setUserData] = useState({
    name: 'Guest',
    school: '',
    grade: '',
    bio: '',
    avatar: '🧠',
    rank: '',
    rankNumber: '',
    totalRank: '',
  })

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      if (!user) {
        setUserData((s) => ({ ...s, name: 'Guest' }))
        return
      }
      const meta = user.user_metadata || {}
      setUserData((s) => ({
        ...s,
        name: meta.fullName || user.email || 'User',
        school: meta.school || s.school,
        grade: meta.classGrade || s.grade,
        bio: meta.bio || s.bio,
      }))
    })
    return () => { mounted = false }
  }, [])

  const stats = [
    { icon: Trophy, label: 'Battles Won', value: '127', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    { icon: Target, label: 'Win Rate', value: '78%', color: 'text-green-500', bgColor: 'bg-green-50' },
    { icon: Zap, label: 'Current Streak', value: '12 Days', color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { icon: Star, label: 'Points', value: '8,543', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  ];

  const achievements = [
    { icon: Medal, title: 'First Victory', description: 'Won your first battle', earned: true },
    { icon: Sword, title: 'Battle Master', description: 'Won 100 battles', earned: true },
    { icon: Brain, title: 'Quiz Genius', description: 'Perfect score in 10 quizzes', earned: true },
    { icon: Shield, title: 'Streak Warrior', description: '30-day win streak', earned: false },
    { icon: Award, title: 'Top 50', description: 'Ranked in top 50 globally', earned: true },
    { icon: Users, title: 'School Champion', description: 'Top scorer in your school', earned: false },
  ];

  const recentBattles = [
    { opponent: 'Rahul Kumar', subject: 'Mathematics', result: 'Won', score: '85/100', date: '2 hours ago' },
    { opponent: 'Anjali Sharma', subject: 'Science', result: 'Won', score: '92/100', date: '1 day ago' },
    { opponent: 'Vikram Singh', subject: 'History', result: 'Lost', score: '78/100', date: '2 days ago' },
  ];

  // Client-side editable profile: avatar/banner upload and name edit
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      setCurrentUser(user || null)
      if (user) {
        const meta = (user.user_metadata || {}) as Record<string, unknown>
        setNameInput(meta.fullName || user.email || '')
        setUserData((s) => ({ ...s, avatar: meta.avatar_url || s.avatar, bio: meta.bio || s.bio }))
      }
    })
    return () => { mounted = false }
  }, [])

  const uploadToStorage = async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return publicData.publicUrl
  }

  const handleAvatarChange = async (f: File | null) => {
    if (!currentUser) return
    if (!f) return
    if (f.size > 4 * 1024 * 1024) { setMessage('Avatar must be <= 4MB'); return }
    try {
      setAvatarUploading(true)
      const path = `avatars/${currentUser.id}/avatar_${Date.now()}`
      const url = await uploadToStorage('avatars', path, f)
      await supabase.auth.updateUser({ data: { avatar_url: url } })
      setUserData((s) => ({ ...s, avatar: url }))
      setMessage('Avatar updated')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage(msg || 'Upload failed')
    } finally { setAvatarUploading(false) }
  }

  const handleBannerChange = async (f: File | null) => {
    if (!currentUser) return
    if (!f) return
    if (f.size > 4 * 1024 * 1024) { setMessage('Banner must be <= 4MB'); return }
    try {
      setBannerUploading(true)
      const path = `banners/${currentUser.id}/banner_${Date.now()}`
      const url = await uploadToStorage('banners', path, f)
      await supabase.auth.updateUser({ data: { banner_url: url } })
      setUserData((s) => ({ ...s }))
      setMessage('Banner updated')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage(msg || 'Upload failed')
    } finally { setBannerUploading(false) }
  }

  const saveName = async () => {
    if (!currentUser) return
    try {
      setMessage('Saving name...')
      await supabase.auth.updateUser({ data: { fullName: nameInput } })
      setUserData((s) => ({ ...s, name: nameInput }))
      setEditingName(false)
      setMessage('Name updated')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage(msg || 'Update failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 animate-slideUp">
          <div className="h-32 sm:h-40 relative">
            {currentUser?.user_metadata?.banner_url ? (
              <div className="absolute inset-0">
                <Image src={currentUser.user_metadata.banner_url} alt="banner" fill className="object-cover" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600" />
            )}
            <div className="absolute right-4 top-4">
              <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-1 bg-white/80 rounded-lg text-sm"> 
                <input id="banner-upload" accept="image/*" type="file" className="hidden" onChange={(ev) => handleBannerChange(ev.target.files?.[0] ?? null)} />
                {bannerUploading ? 'Uploading…' : 'Edit Banner'}
              </label>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">
              {/* Avatar */}
              <div className="flex-shrink-0 mb-4 sm:mb-0 relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl flex items-center justify-center bg-white">
                  {typeof userData.avatar === 'string' && userData.avatar.startsWith('http') ? (
                    <Image src={userData.avatar} alt="avatar" width={128} height={128} className="object-cover" />
                  ) : (
                    <div className="text-6xl">{userData.avatar}</div>
                  )}
                </div>
                <div className="absolute left-0 bottom-0 transform translate-y-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-1 bg-white rounded-full text-sm">
                    <input id="avatar-upload" accept="image/*" type="file" className="hidden" onChange={(ev) => handleAvatarChange(ev.target.files?.[0] ?? null)} />
                    {avatarUploading ? 'Uploading…' : 'Edit'}
                  </label>
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 sm:ml-6 text-center sm:text-left">
                {message && (
                  <div className="mb-2 text-sm text-emerald-600">{message}</div>
                )}
                <div className="flex items-center gap-3">
                  {editingName ? (
                    <>
                      <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="border rounded-md px-3 py-1" />
                      <button onClick={saveName} className="px-3 py-1 bg-blue-600 text-white rounded-md">Save</button>
                      <button onClick={() => { setEditingName(false); setNameInput(userData.name) }} className="px-3 py-1 rounded-md">Cancel</button>
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{userData.name}</h1>
                      <button onClick={() => setEditingName(true)} className="text-sm text-blue-600 underline ml-2">Edit</button>
                    </>
                  )}
                </div>
                <p className="text-slate-600 mb-2">{userData.school} • {userData.grade}</p>
                <p className="text-slate-700 max-w-2xl">{userData.bio}</p>
              </div>

              {/* Rank Badge */}
              <div className="mt-4 sm:mt-0 sm:ml-6">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-xl shadow-lg text-center animate-glow">
                  <div className="text-sm font-medium">Current Rank</div>
                  <div className="text-2xl font-extrabold">{userData.rank}</div>
                  <div className="text-xs">#{userData.rankNumber} of {userData.totalRank}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slideUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`${stat.bgColor} ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout - Achievements & Recent Battles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slideUp" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center mb-6">
              <Award className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-extrabold text-slate-900">Achievements</h2>
            </div>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                    achievement.earned
                      ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                      achievement.earned
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <achievement.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{achievement.title}</h3>
                    <p className="text-sm text-slate-600">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Battles Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slideUp" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center mb-6">
              <Sword className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-extrabold text-slate-900">Recent Battles</h2>
            </div>
            <div className="space-y-4">
              {recentBattles.map((battle, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {battle.opponent.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{battle.opponent}</h3>
                        <p className="text-sm text-slate-600">{battle.subject}</p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        battle.result === 'Won'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {battle.result}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Score: {battle.score}</span>
                    <span>{battle.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg">
              View All Battles
            </button>
          </div>
        </div>

        {/* Activity/Progress Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 animate-slideUp" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-extrabold text-slate-900">Progress Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Subjects Mastered</h3>
              <div className="text-3xl font-extrabold text-blue-600">8/12</div>
              <div className="mt-3 bg-white rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <Users className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">School Ranking</h3>
              <div className="text-3xl font-extrabold text-green-600">#2</div>
              <p className="text-sm text-slate-600 mt-2">Out of 156 students</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Brain className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Knowledge Points</h3>
              <div className="text-3xl font-extrabold text-purple-600">8,543</div>
              <p className="text-sm text-slate-600 mt-2">+234 this week</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;
