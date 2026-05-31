import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import DesktopSidebar from '@/components/DesktopSidebar';
import BottomNav from '@/components/BottomNav';
import { FileText, Download, Eye, Calendar, BookOpen, Search, Filter, X, ChevronRight } from 'lucide-react-native';
import { Link } from 'expo-router';

// Sample data - reflecting the PDF found in public
const PAPERS = [
  {
    id: '1',
    title: 'English Class 9 - Terminal Exam 2024',
    subject: 'English',
    year: '2024',
    type: 'Sample Paper',
    fileUrl: '/05ba9ac3-6fd5-4607-bed0-2913d1e478f6.pdf',
    description: 'Complete syllabus coverage with latest pattern questions from CBSE Board.'
  },
  // Adding placeholders for better UI feel
  {
    id: '2',
    title: 'Mathematics Final Paper 2023',
    subject: 'Mathematics',
    year: '2023',
    type: 'Board Paper',
    fileUrl: '#',
    isLocked: true,
    description: 'Official board paper with step-by-step solutions for practice.'
  },
  {
    id: '3',
    title: 'Science Weekly Test - Unit 1',
    subject: 'Science',
    year: '2024',
    type: 'Weekly Test',
    isLocked: true,
    fileUrl: '#',
    description: 'Unit-wise test paper focusing on Physics & Chemistry basics.'
  }
];

export default function PapersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);

  const subjects = ['All', 'English', 'Mathematics', 'Science', 'Social Science', 'Computer'];

  const filteredPapers = PAPERS.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || paper.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <View className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      <Header />
      <DesktopSidebar />

      <View className="lg:ml-64 px-4 pb-32 pt-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <View className="mb-8">
          <View 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Previous Year Papers
          </View>
          <View 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-slate-500 dark:text-slate-400 mt-1 font-medium"
          >
            Access the archive of official papers and sample questions.
          </View>
        </View>

        {/* Search & Filter Bar */}
        <View className="flex flex-col sm:flex-row gap-4 mb-8">
          <View className="relative flex-1 flex-row">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <TextInput 
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-900 dark:text-white"
            />
          </View>
          <View className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-row">
            {subjects.map(subj => (
              <View
                key={subj}
                onPress={() => setSelectedSubject(subj)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                  selectedSubject === subj 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {subj}
              </View>
            ))}
          </View>
        </View>

        {/* Papers Grid */}
        <View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <>
            {filteredPapers.map((paper, idx) => (
              <View
                key={paper.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all border-b-4 border-b-blue-500/20"
              >
                <View className="flex items-start justify-between mb-4 flex-row">
                  <View className={`p-3 rounded-2xl ${paper.isLocked ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                    <FileText className="h-6 w-6" />
                  </View>
                  <View className="flex flex-col items-end">
                    <Text className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black rounded-full text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                      {paper.year}
                    </Text>
                    <Text className="text-[10px] font-bold text-blue-600/60 dark:text-blue-400/60">{paper.type}</Text>
                  </View>
                </View>

                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                  {paper.title}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 font-medium">
                  {paper.description}
                </Text>

                <View className="flex items-center gap-3 flex-row">
                  {!paper.isLocked ? (
                    <>
                      <View
                        onPress={() => setViewingPdf(paper.fileUrl)}
                        className="flex-1 flex items-center justify-center gap-2 h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-black/10 flex-row"
                      >
                        <Eye className="h-4 w-4" /> View
                      </View>
                      <a
                        href={paper.fileUrl}
                        download
                        className="flex h-11 w-11 items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-100 transition-all flex-row"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </>
                  ) : (
                    <View className="flex-1 flex items-center justify-center gap-2 h-11 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl font-bold text-sm cursor-not-allowed flex-row">
                       Locked (Coming Soon)
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        </View>

        {/* Empty State */}
        {filteredPapers.length === 0 && (
          <View className="flex flex-col items-center justify-center py-20 text-center">
            <View className="h-20 w-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 flex-row">
               <BookOpen className="h-10 w-10" />
            </View>
            <Text className="text-xl font-bold text-slate-900 dark:text-white">No papers found</Text>
            <Text className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your filters or search keywords.</Text>
          </View>
        )}
      </View>

      {/* PDF Viewer Portal */}
      <>
        {viewingPdf && (
          <View
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <View
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <View className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-row">
                <Text className="font-bold text-slate-900 dark:text-white">Document Viewer</Text>
                <View 
                  onPress={() => setViewingPdf(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-slate-500" />
                </View>
              </View>
              <View className="flex-1 bg-slate-500 flex-row">
                <iframe 
                  src={viewingPdf}
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                />
              </View>
            </View>
          </View>
        )}
      </>

      <BottomNav />
    </View>
  );
}
