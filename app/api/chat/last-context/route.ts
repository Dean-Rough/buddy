import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const childAccountId = url.searchParams.get('childAccountId');

    if (!childAccountId) {
      return NextResponse.json(
        { error: 'childAccountId is required' },
        { status: 400 }
      );
    }

    // Get the most recent conversation (excluding today to avoid referencing current session)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const lastConversation = await prisma.conversation.findFirst({
      where: {
        childAccountId,
        startedAt: {
          lt: yesterday,
        },
      },
      include: {
        messages: {
          where: {
            role: 'child', // Only look at child's messages for context
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 messages from child
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!lastConversation || lastConversation.messages.length === 0) {
      return NextResponse.json({
        hasContext: false,
      });
    }

    // Analyze the last conversation for context
    const messages = lastConversation.messages;
    const topics = lastConversation.topics || [];
    const mood = lastConversation.mood || 'neutral';
    
    // Extract key topics from messages
    const messageText = messages.map(m => m.content.toLowerCase()).join(' ');
    const keyTopics = extractKeyTopics(messageText);
    
    // Determine time ago
    const timeAgo = getTimeAgo(lastConversation.startedAt);
    
    // Get primary topic
    const lastTopic = topics.length > 0 ? topics[0] : detectMainTopic(messageText);

    return NextResponse.json({
      hasContext: true,
      lastTopic,
      lastMood: mood,
      timeAgo,
      keyTopics,
      conversationDate: lastConversation.startedAt,
    });
  } catch (error) {
    console.error('Error getting last context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractKeyTopics(text: string): string[] {
  const topicKeywords = {
    party: ['party', 'birthday', 'celebration', 'cake', 'presents'],
    test: ['test', 'exam', 'quiz', 'homework', 'assignment'],
    movie: ['movie', 'film', 'cinema', 'theater', 'watched'],
    vacation: ['vacation', 'trip', 'travel', 'holiday', 'visit'],
    sleepover: ['sleepover', 'slumber party', 'stayed over', 'overnight'],
    game: ['game', 'play', 'video game', 'gaming', 'console'],
    school: ['school', 'teacher', 'class', 'lesson', 'recess'],
    friends: ['friend', 'buddy', 'pal', 'hang out', 'play with'],
    family: ['mom', 'dad', 'parent', 'sibling', 'brother', 'sister', 'family'],
    pets: ['dog', 'cat', 'pet', 'animal', 'puppy', 'kitten'],
    sports: ['soccer', 'football', 'basketball', 'baseball', 'sport', 'practice', 'game'],
    art: ['draw', 'paint', 'art', 'color', 'picture', 'craft'],
    music: ['music', 'song', 'sing', 'instrument', 'piano', 'guitar'],
  };

  const foundTopics: string[] = [];
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      foundTopics.push(topic);
    }
  }

  return foundTopics;
}

function detectMainTopic(text: string): string {
  const topics = extractKeyTopics(text);
  if (topics.length > 0) {
    return topics[0];
  }

  // Simple topic detection based on frequent words
  if (text.includes('school') || text.includes('teacher')) return 'school';
  if (text.includes('friend') || text.includes('play')) return 'friends';
  if (text.includes('family') || text.includes('home')) return 'family';
  if (text.includes('game') || text.includes('gaming')) return 'games';
  
  return 'general_chat';
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays <= 7) {
    return 'this_week';
  } else if (diffDays <= 30) {
    return 'this_month';
  } else {
    return 'long_ago';
  }
}