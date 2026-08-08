import supabase from './db-client.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let path = url.pathname;

  // Strip leading /api prefix if present
  if (path.startsWith('/api')) {
    path = path.substring(4);
  }
  if (!path || path === '') path = '/';

  // Helper query getter
  const getParam = (key) => url.searchParams.get(key) || req.query?.[key];

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. PROFILE (/profile)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/profile' || path.startsWith('/profile/')) {
      if (req.method === 'GET') {
        let user_id = getParam('user_id');
        let email = getParam('email');

        if (path.startsWith('/profile/') && path !== '/profile/avatar' && path !== '/profile/update') {
          user_id = path.replace('/profile/', '');
        }

        if (!user_id && !email) return res.status(400).json({ error: 'user_id or email required' });

        let profileData = null;
        if (user_id) {
          const { data } = await supabase.from('users').select('*').eq('id', user_id).maybeSingle();
          profileData = data;
        }

        if (!profileData && email) {
          const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
          if (data) {
            profileData = data;
            if (user_id && data.id !== user_id) {
              await supabase.from('users').update({ id: user_id, updated_at: new Date().toISOString() }).eq('email', email);
              profileData.id = user_id;
            }
          }
        }

        return res.status(200).json(profileData || null);
      }

      if (req.method === 'POST' || req.method === 'PUT' || path === '/profile/update') {
        const body = req.body || {};
        const user_id = body.user_id || getParam('user_id');
        if (!user_id) return res.status(400).json({ error: 'user_id required' });

        const profileData = {
          id: user_id,
          email: body.email || null,
          full_name: body.full_name || 'Student',
          grade: body.grade ? parseInt(body.grade) : 10,
          stream: body.stream || null,
          subjects: Array.isArray(body.subjects) ? body.subjects : [],
          school_id: body.school_id ? String(body.school_id) : null,
          school_name: body.school_name || null,
          district: body.district || null,
          province: body.province || null,
          bio: body.bio || null,
          avatar_url: body.avatar_url || null,
          avatar_color: body.avatar_color || null,
          instagram_url: body.instagram_url || null,
          facebook_url: body.facebook_url || null,
          linkedin_url: body.linkedin_url || null,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('users').upsert(profileData, { onConflict: 'id' }).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. SUBJECTS (/subjects)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/subjects') {
      if (req.method === 'GET') {
        const grade = getParam('grade');
        const stream = getParam('stream');
        let query = supabase.from('subjects').select('*').order('name');
        if (grade) query = query.eq('grade', parseInt(grade));
        if (stream) query = query.eq('stream', stream);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CHAPTERS (/chapters)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/chapters') {
      if (req.method === 'GET') {
        const subject = getParam('subject');
        const grade = getParam('grade');
        let query = supabase.from('chapters').select('*').order('chapter_number');
        if (subject) query = query.ilike('subject_name', `%${subject}%`);
        if (grade) query = query.eq('grade', parseInt(grade));
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. QUESTIONS (/questions)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/questions') {
      if (req.method === 'GET') {
        const chapter_id = getParam('chapter_id');
        const subject = getParam('subject');
        const limit = parseInt(getParam('limit') || '20');

        let query = supabase.from('questions').select('*');
        if (chapter_id) query = query.eq('chapter_id', chapter_id);
        if (subject) query = query.ilike('subject_name', `%${subject}%`);
        query = query.limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. VIDEOS (/videos)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/videos') {
      if (req.method === 'GET') {
        const subject = getParam('subject');
        let query = supabase.from('videos').select('*').order('title');
        if (subject) query = query.ilike('subject_name', `%${subject}%`);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. NOTES (/notes)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/notes') {
      if (req.method === 'GET') {
        const subject = getParam('subject');
        const grade = getParam('grade');
        let query = supabase.from('notes').select('*').order('title');
        if (subject) query = query.ilike('subject_name', `%${subject}%`);
        if (grade) query = query.eq('grade', parseInt(grade));
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. PAST PAPER ANALYSIS (/past-paper-analysis)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/past-paper-analysis' || path === '/ppa') {
      if (req.method === 'GET') {
        const subject = getParam('subject');
        let query = supabase.from('past_paper_records').select('*');
        if (subject) query = query.ilike('subject_name', `%${subject}%`);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. COMMUNITY POSTS (/community-posts or /community/posts)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/community-posts' || path === '/community/posts') {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('community_posts').select('*, users(full_name, avatar_url)').order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const body = req.body || {};
        const { user_id, content, image_url, subject } = body;
        if (!user_id || !content) return res.status(400).json({ error: 'user_id and content required' });

        const { data, error } = await supabase.from('community_posts').insert({
          user_id,
          content,
          image_url: image_url || null,
          subject: subject || null,
          likes_count: 0,
          comments_count: 0,
        }).select().single();

        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    // Community comments & likes
    if (path === '/community/comments') {
      if (req.method === 'GET') {
        const post_id = getParam('post_id');
        if (!post_id) return res.status(400).json({ error: 'post_id required' });
        const { data, error } = await supabase.from('community_comments').select('*, users(full_name, avatar_url)').eq('post_id', post_id).order('created_at', { ascending: true });
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const { post_id, user_id, content } = req.body || {};
        if (!post_id || !user_id || !content) return res.status(400).json({ error: 'post_id, user_id, and content required' });

        const { data, error } = await supabase.from('community_comments').insert({ post_id, user_id, content }).select().single();
        if (error) throw error;

        // increment comments count
        try {
          const { data: p } = await supabase.from('community_posts').select('comments_count').eq('id', post_id).single();
          await supabase.from('community_posts').update({ comments_count: (p?.comments_count || 0) + 1 }).eq('id', post_id);
        } catch {}

        return res.status(201).json(data);
      }
    }

    if (path === '/community/like') {
      if (req.method === 'POST') {
        const { post_id, user_id } = req.body || {};
        if (!post_id || !user_id) return res.status(400).json({ error: 'post_id and user_id required' });

        const { data: existing } = await supabase.from('post_likes').select('id').eq('post_id', post_id).eq('user_id', user_id).maybeSingle();

        if (existing) {
          await supabase.from('post_likes').delete().eq('id', existing.id);
          const { data: p } = await supabase.from('community_posts').select('likes_count').eq('id', post_id).single();
          const newLikes = Math.max(0, (p?.likes_count || 1) - 1);
          await supabase.from('community_posts').update({ likes_count: newLikes }).eq('id', post_id);
          return res.status(200).json({ liked: false, likes_count: newLikes });
        } else {
          await supabase.from('post_likes').insert({ post_id, user_id });
          const { data: p } = await supabase.from('community_posts').select('likes_count').eq('id', post_id).single();
          const newLikes = (p?.likes_count || 0) + 1;
          await supabase.from('community_posts').update({ likes_count: newLikes }).eq('id', post_id);
          return res.status(200).json({ liked: true, likes_count: newLikes });
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 9. DOUBTS (/doubts & /doubt-answers)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/doubts' || path.startsWith('/doubts/')) {
      if (req.method === 'GET') {
        const subject = getParam('subject');
        let query = supabase.from('doubts').select('*, users(full_name, avatar_url)').order('created_at', { ascending: false });
        if (subject) query = query.ilike('subject_name', `%${subject}%`);
        const { data, error } = await query.limit(50);
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const { user_id, title, question_text, subject_name } = req.body || {};
        if (!user_id || !title) return res.status(400).json({ error: 'user_id and title required' });
        const { data, error } = await supabase.from('doubts').insert({
          user_id,
          title,
          question_text: question_text || title,
          subject_name: subject_name || 'General',
          status: 'open',
        }).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    if (path === '/doubt-answers') {
      if (req.method === 'GET') {
        const doubt_id = getParam('doubt_id');
        if (!doubt_id) return res.status(400).json({ error: 'doubt_id required' });
        const { data, error } = await supabase.from('doubt_answers').select('*, users(full_name, avatar_url)').eq('doubt_id', doubt_id).order('created_at', { ascending: true });
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const { doubt_id, user_id, answer_text } = req.body || {};
        if (!doubt_id || !user_id || !answer_text) return res.status(400).json({ error: 'doubt_id, user_id, and answer_text required' });
        const { data, error } = await supabase.from('doubt_answers').insert({ doubt_id, user_id, answer_text }).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 10. STUDY ROOMS (/study-rooms)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/study-rooms' || path.startsWith('/study-rooms/')) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('study_rooms').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const { name, subject, created_by } = req.body || {};
        const { data, error } = await supabase.from('study_rooms').insert({
          name: name || 'Nepal Study Room',
          subject: subject || 'General',
          created_by: created_by || null,
          member_count: 1,
        }).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 11. LEADERBOARD (/leaderboard)
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/leaderboard') {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('users').select('id, full_name, avatar_url, grade, school_name, xp_points, streak_count').order('xp_points', { ascending: false }).limit(50);
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 12. XP / QUESTION ATTEMPTS / CHAPTER PROGRESS
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/xp') {
      if (req.method === 'POST') {
        const { user_id, xp, reason } = req.body || {};
        if (!user_id || !xp) return res.status(400).json({ error: 'user_id and xp required' });

        const { data: user } = await supabase.from('users').select('xp_points').eq('id', user_id).single();
        const currentXP = user?.xp_points || 0;
        const newXP = currentXP + parseInt(xp);

        await supabase.from('users').update({ xp_points: newXP }).eq('id', user_id);
        return res.status(200).json({ success: true, xp_points: newXP });
      }
    }

    if (path === '/question-attempts') {
      if (req.method === 'GET') {
        const user_id = getParam('user_id');
        if (!user_id) return res.status(400).json({ error: 'user_id required' });
        const { data, error } = await supabase.from('question_attempts').select('*').eq('user_id', user_id);
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const { user_id, question_id, selected_answer, is_correct } = req.body || {};
        const { data, error } = await supabase.from('question_attempts').insert({ user_id, question_id, selected_answer, is_correct }).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    if (path === '/chapter-progress' || path === '/chapter-progress/auto') {
      if (req.method === 'GET') {
        const user_id = getParam('user_id');
        const subject = getParam('subject');
        if (!user_id) return res.status(400).json({ error: 'user_id required' });
        let query = supabase.from('chapter_progress').select('*').eq('user_id', user_id);
        if (subject) query = query.ilike('subject_name', `%${subject}%`);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const { user_id, chapter_id, status, subject } = req.body || {};
        const { data, error } = await supabase.from('chapter_progress').upsert({
          user_id,
          chapter_id,
          status: status || 'completed',
          subject_name: subject || null,
        }, { onConflict: 'user_id,chapter_id' }).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 13. SCHOOLS / INSTITUTES / MISSIONS / TODOS / POMODORO
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/schools') {
      if (req.method === 'GET') {
        const q = getParam('q');
        let query = supabase.from('schools').select('*').order('name');
        if (q) query = query.ilike('name', `%${q}%`);
        const { data, error } = await query.limit(20);
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    if (path === '/institutes') {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('institutes').select('*').order('name');
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    if (path === '/institute-posts') {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('institute_posts').select('*, institutes(name, logo_url)').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    if (path === '/missions') {
      if (req.method === 'GET') {
        const user_id = getParam('user_id');
        if (!user_id) return res.status(400).json({ error: 'user_id required' });
        const { data, error } = await supabase.from('daily_missions').select('*').eq('user_id', user_id);
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    if (path === '/todos') {
      if (req.method === 'GET') {
        const user_id = getParam('user_id');
        if (!user_id) return res.status(400).json({ error: 'user_id required' });
        const { data, error } = await supabase.from('todos').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const { user_id, title } = req.body || {};
        const { data, error } = await supabase.from('todos').insert({ user_id, title, is_completed: false }).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    if (path === '/pomodoro') {
      if (req.method === 'GET') {
        const user_id = getParam('user_id');
        if (!user_id) return res.status(400).json({ error: 'user_id required' });
        const { data, error } = await supabase.from('pomodoro_sessions').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      }
      if (req.method === 'POST') {
        const { user_id, duration_minutes, subject_name } = req.body || {};
        const { data, error } = await supabase.from('pomodoro_sessions').insert({ user_id, duration_minutes, subject_name: subject_name || 'Study' }).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 14. AI TUTOR & GOOGLE AUTH
    // ──────────────────────────────────────────────────────────────────────────
    if (path === '/ai-tutor') {
      if (req.method === 'POST') {
        const { prompt, subject, grade } = req.body || {};
        const systemPrompt = `You are PadhaiNepal AI Assistant, an expert, encouraging Nepali tutor for Grade ${grade || 10} ${subject || 'general'} curriculum (CDC/NEB). Answer clearly with bullet points, simple examples, and formulas if needed.`;

        // Check if GEMINI_API_KEY is available
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
          return res.status(200).json({
            reply: `Here is the explanation for your query:\n\n1. **Core Concept**: ${prompt}\n2. **NEB Board Tip**: Focus on key definitions, numerical formulas, and neat diagrams for high marks in Grade ${grade || 10} ${subject || ''}.\n3. **Quick Example**: Practice past questions from 2078-2080.`
          });
        }

        try {
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nStudent Question: ${prompt}` }] }]
            }),
          });
          const geminiData = await geminiRes.json();
          const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response. Please try again.';
          return res.status(200).json({ reply: replyText });
        } catch (e) {
          return res.status(200).json({ reply: `Explanation: ${prompt}\n\nStudy tip: Review your Grade ${grade || 10} CDC textbook chapters.` });
        }
      }
    }

    if (path === '/auth/google') {
      if (req.method === 'POST') {
        const { token } = req.body || {};
        if (!token) return res.status(400).json({ error: 'Token required' });
        return res.status(200).json({ success: true, token });
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 15. ADMIN PANEL ENDPOINTS (/admin/...)
    // ──────────────────────────────────────────────────────────────────────────
    if (path.startsWith('/admin/')) {
      const resource = path.replace('/admin/', '');

      if (resource === 'users' && req.method === 'GET') {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data || []);
      }

      if (resource === 'subjects') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('subjects').select('*').order('id');
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('subjects').insert(req.body).select().single();
          if (error) throw error;
          return res.status(201).json(data);
        }
      }

      if (resource === 'videos') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('videos').select('*').order('id');
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('videos').insert(req.body).select().single();
          if (error) throw error;
          return res.status(201).json(data);
        }
      }

      if (resource === 'notes') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('notes').select('*').order('id');
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('notes').insert(req.body).select().single();
          if (error) throw error;
          return res.status(201).json(data);
        }
      }

      if (resource === 'questions') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('questions').select('*').order('id').limit(100);
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST') {
          const { data, error } = await supabase.from('questions').insert(req.body).select().single();
          if (error) throw error;
          return res.status(201).json(data);
        }
      }
    }

    // Default fallback
    return res.status(404).json({ error: `Endpoint not found: ${req.method} ${path}` });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
