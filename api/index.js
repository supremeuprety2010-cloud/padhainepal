import supabase from './db-client.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Robust URL / Path Parsing for Vercel Serverless
  let rawPath = req.headers['x-matched-path'] || req.headers['x-invoke-path'] || req.url || '';
  let pathname = '/';
  let searchParams = new URLSearchParams();

  try {
    const parsed = new URL(rawPath, `http://${req.headers.host || 'localhost'}`);
    pathname = parsed.pathname;
    searchParams = parsed.searchParams;
  } catch (e) {
    pathname = rawPath.split('?')[0];
  }

  // Strip leading /api if present
  if (pathname.startsWith('/api')) {
    pathname = pathname.substring(4);
  }
  // Strip /index.js if present
  if (pathname.startsWith('/index.js')) {
    pathname = pathname.substring(9);
  }
  if (!pathname || pathname === '') pathname = '/';

  // Helper query getter
  const getParam = (key) => searchParams.get(key) || req.query?.[key];

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // 1. PROFILE (/profile)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/profile' || pathname.startsWith('/profile')) {
      if (req.method === 'GET') {
        let user_id = getParam('user_id');
        let email = getParam('email');

        if (pathname.startsWith('/profile/') && pathname !== '/profile/avatar' && pathname !== '/profile/update') {
          user_id = pathname.replace('/profile/', '');
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

      // Handle Avatar Upload (/profile/avatar)
      if (pathname === '/profile/avatar' && req.method === 'POST') {
        const { user_id, file_base64, content_type } = req.body || {};
        if (!user_id || !file_base64) return res.status(400).json({ error: 'user_id and file_base64 required' });

        const avatarDataUrl = `data:${content_type || 'image/png'};base64,${file_base64}`;

        await supabase.from('users').update({ avatar_url: avatarDataUrl, updated_at: new Date().toISOString() }).eq('id', user_id);
        return res.status(200).json({ url: avatarDataUrl });
      }

      // Save Profile (/profile or /profile/update)
      if (req.method === 'POST' || req.method === 'PUT' || pathname === '/profile/update') {
        const body = req.body || {};
        const user_id = body.user_id || body.id || getParam('user_id');
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
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('users').upsert(profileData, { onConflict: 'id' }).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. LEADERBOARD (/leaderboard)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/leaderboard') {
      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, grade, school_name, xp_points, streak_count')
          .order('xp_points', { ascending: false })
          .limit(50);
        if (error) throw error;
        return res.status(200).json(data || []);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. SUBJECTS (/subjects)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/subjects') {
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
    // 4. CHAPTERS (/chapters)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/chapters') {
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
    // 5. QUESTIONS (/questions)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/questions') {
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
    // 6. VIDEOS (/videos)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/videos') {
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
    // 7. NOTES (/notes)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/notes') {
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
    // 8. PAST PAPER ANALYSIS (/past-paper-analysis or /ppa)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/past-paper-analysis' || pathname === '/ppa') {
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
    // 9. COMMUNITY POSTS (/community-posts or /community/posts)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname === '/community-posts' || pathname === '/community/posts') {
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

    // ──────────────────────────────────────────────────────────────────────────
    // 10. ADMIN PANEL ENDPOINTS (/admin/...)
    // ──────────────────────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      const resource = pathname.replace('/admin/', '').replace('/admin', '');

      if (resource === 'users') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST' || req.method === 'PUT') {
          const { user_id, id, role, xp_points, streak_count, is_admin } = req.body || {};
          const targetId = user_id || id;
          if (!targetId) return res.status(400).json({ error: 'target user id required' });

          const updates = {};
          if (role !== undefined) updates.role = role;
          if (xp_points !== undefined) updates.xp_points = parseInt(xp_points);
          if (streak_count !== undefined) updates.streak_count = parseInt(streak_count);
          if (is_admin !== undefined) updates.is_admin = Boolean(is_admin);

          const { data, error } = await supabase.from('users').update(updates).eq('id', targetId).select().single();
          if (error) throw error;
          return res.status(200).json(data);
        }
      }

      if (resource === 'subjects') {
        if (req.method === 'GET') {
          const { data: subData } = await supabase.from('subjects').select('*').order('grade').order('id');
          const { data: chapData } = await supabase.from('chapters').select('*').order('chapter_number');

          const subjectsWithChap = (subData || []).map(s => ({
            ...s,
            chapters: (chapData || []).filter(c => c.subject_name?.toLowerCase() === s.name?.toLowerCase() && c.grade === s.grade)
          }));

          return res.status(200).json(subjectsWithChap);
        }

        if (req.method === 'POST') {
          const body = req.body || {};

          if (body.type === 'chapter') {
            const { data, error } = await supabase.from('chapters').insert({
              chapter_number: body.chapter_number || 1,
              title: body.name || body.title,
              subject_name: body.subject_name,
              grade: parseInt(body.grade || 10),
              description: body.description || null,
            }).select().single();

            if (error) throw error;
            return res.status(201).json(data);
          } else {
            // Add new subject with auto-generated ID
            const subjectData = {
              name: body.name,
              grade: parseInt(body.grade || 10),
              stream: body.stream || null,
              description: body.description || null,
              icon: body.icon || '📚',
            };

            const { data, error } = await supabase.from('subjects').insert(subjectData).select().single();
            if (error) {
              console.error('Insert Subject Error:', error);
              throw error;
            }
            return res.status(201).json(data);
          }
        }

        if (req.method === 'DELETE') {
          const body = req.body || {};
          if (body.type === 'chapter' && body.id) {
            await supabase.from('chapters').delete().eq('id', body.id);
            return res.status(200).json({ ok: true });
          } else if (body.id) {
            await supabase.from('subjects').delete().eq('id', body.id);
            return res.status(200).json({ ok: true });
          }
        }
      }

      if (resource === 'videos') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST') {
          const { title, youtube_id, creator_name, channel_name, duration, views, subject_name, chapter_title, grade } = req.body || {};
          const { data, error } = await supabase.from('videos').insert({
            title,
            youtube_id,
            creator_name: creator_name || channel_name || 'NEB Educator',
            duration: duration || '15:00',
            views: views || '1.2k views',
            subject_name: subject_name || 'General',
            chapter_title: chapter_title || null,
            grade: grade ? parseInt(grade) : 10,
          }).select().single();
          if (error) throw error;
          return res.status(201).json(data);
        }
        if (req.method === 'DELETE') {
          const { id } = req.body || {};
          if (id) await supabase.from('videos').delete().eq('id', id);
          return res.status(200).json({ ok: true });
        }
      }

      if (resource === 'notes') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST') {
          const { title, subject_name, grade, file_url, category, summary, is_premium } = req.body || {};
          const { data, error } = await supabase.from('notes').insert({
            title,
            subject_name: subject_name || 'General',
            grade: grade ? parseInt(grade) : 10,
            file_url: file_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            category: category || 'Chapter Notes',
            summary: summary || title,
            is_premium: Boolean(is_premium),
          }).select().single();
          if (error) throw error;
          return res.status(201).json(data);
        }
        if (req.method === 'DELETE') {
          const { id } = req.body || {};
          if (id) await supabase.from('notes').delete().eq('id', id);
          return res.status(200).json({ ok: true });
        }
      }

      if (resource === 'questions') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('questions').select('*').order('id', { ascending: false }).limit(100);
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST') {
          const { question_text, options, correct_answer, explanation, difficulty, year_asked, subject_name, grade } = req.body || {};
          const { data, error } = await supabase.from('questions').insert({
            question_text,
            options: Array.isArray(options) ? options : [options],
            correct_answer: parseInt(correct_answer || 0),
            explanation: explanation || '',
            difficulty: difficulty || 'medium',
            year_asked: year_asked || '2080',
            subject_name: subject_name || 'General',
            grade: grade ? parseInt(grade) : 10,
          }).select().single();
          if (error) throw error;
          return res.status(201).json(data);
        }
        if (req.method === 'DELETE') {
          const { id } = req.body || {};
          if (id) await supabase.from('questions').delete().eq('id', id);
          return res.status(200).json({ ok: true });
        }
      }

      if (resource === 'ppa') {
        if (req.method === 'GET') {
          const { data, error } = await supabase.from('past_paper_records').select('*').order('id', { ascending: false });
          if (error) throw error;
          return res.status(200).json(data || []);
        }
        if (req.method === 'POST') {
          const { subject_name, chapter_title, weightage_marks, importance_level, frequent_questions, grade } = req.body || {};
          const { data, error } = await supabase.from('past_paper_records').insert({
            subject_name: subject_name || 'General',
            chapter_title: chapter_title || 'General',
            weightage_marks: weightage_marks ? parseInt(weightage_marks) : 5,
            importance_level: importance_level || 'High',
            frequent_questions: frequent_questions || '',
            grade: grade ? parseInt(grade) : 10,
          }).select().single();
          if (error) throw error;
          return res.status(201).json(data);
        }
        if (req.method === 'DELETE') {
          const { id } = req.body || {};
          if (id) await supabase.from('past_paper_records').delete().eq('id', id);
          return res.status(200).json({ ok: true });
        }
      }
    }

    // Default fallback
    return res.status(404).json({ error: `Endpoint not found: ${req.method} ${pathname}` });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
