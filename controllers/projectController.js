const { query } = require('../config/database');

/*
 * وحدة إدارة المشاريع
 * تقوم بإنشاء مشاريع جديدة وجلب قائمة المشاريع أو مشروع واحد
 */

// إنشاء مشروع جديد
exports.createProject = async (req, res) => {
  try {
    const { title, description, targetAmount, impactDescription, ownerName } = req.body;
    if (!title || !description || !targetAmount || !ownerName) {
      return res.status(400).json({ message: 'يجب إدخال العنوان والوصف والهدف المالي واسم المالك' });
    }
    const sql = `INSERT INTO projects (title, description, targetAmount, currentAmount, impactDescription, ownerName) VALUES (?, ?, ?, 0, ?, ?)`;
    await query(sql, [title, description, targetAmount, impactDescription || null, ownerName]);
    return res.status(201).json({ message: 'تم إنشاء المشروع بنجاح' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المشروع' });
  }
};

// استيراد fetch بشكل متوافق مع Node.js
let fetchFunc;
if (typeof fetch === 'undefined') {
  // استخدام node-fetch كحل احتياطي عند الحاجة
  fetchFunc = (...args) => import('node-fetch').then(({ default: fetchImported }) => fetchImported(...args));
} else {
  fetchFunc = fetch;
}

// دالة مساعدة لتنفيذ البحث باستخدام نموذج ذكاء اصطناعي عبر OpenRouter أو OpenAI
async function performAISearch(searchQuery, projects) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt =
    'أنت مساعد يقوم بمطابقة استعلام البحث مع المشروع الأكثر صلة. ستعطى قائمة بالمشاريع مع معرفاتها، العنوان، الوصف، واسم المالك. استخدم فهمك الدلالي لاختيار المشروع الذي يتطابق بشكل أفضل مع الاستعلام. يجب أن تعيد فقط معرف المشروع دون أي معلومات إضافية.';
  const projectSummaries = projects
    .map(p => `ID: ${p.projectId}, العنوان: ${p.title}, الوصف: ${p.description?.slice(0, 60) || ''}, المالك: ${p.ownerName || ''}`)
    .join('\n');
  const userPrompt = `قائمة المشاريع:\n${projectSummaries}\n\nاستعلام البحث: ${searchQuery}\n\nأعد فقط معرف المشروع (ID) للمشروع الأنسب.`;

  const body = {
    model: 'meta-llama/llama-3-8b-instruct', // يمكن استخدام نموذج أقل تكلفة
    // model: 'openai/gpt-3.5-turbo', // يمكن استخدام نموذج أقل تكلفة
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 20,
    temperature: 0
  };

  try {
    const response = await fetchFunc('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'SocioFund AI Search'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      console.error('AI search failed:', await response.text());
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const match = content.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  } catch (err) {
    console.error('Error during AI search:', err);
    return null;
  }
}

// دالة جلب المشاريع مع دمج البحث التقليدي والذكاء الاصطناعي
exports.getProjects = async (req, res) => {
  try {
    const search = req.query.search;
    // إذا كان هناك استعلام بحث، حاول استخدام البحث بالذكاء الاصطناعي أولاً
    if (search) {
      // جلب جميع المشاريع لاستخدامها في اختيار أفضل مشروع
      const allSql = `SELECT * FROM projects ORDER BY createdAt DESC`;
      const allProjects = await query(allSql);

      // استدعاء البحث بالذكاء الاصطناعي
      const aiProjectId = await performAISearch(search, allProjects);
      if (aiProjectId) {
        const sql = `SELECT * FROM projects WHERE projectId = ?`;
        const selected = await query(sql, [aiProjectId]);
        if (selected.length > 0) {
          return res.json(selected);
        }
      }

      // إذا لم تُرجع الدالة AI نتيجة، استخدم البحث التقليدي بـ LIKE
      const like = `%${search}%`;
      const fallbackSql = `
        SELECT *
        FROM projects
        WHERE title LIKE ?
           OR description LIKE ?
           OR ownerName LIKE ?
        ORDER BY createdAt DESC
      `;
      const fallbackProjects = await query(fallbackSql, [like, like, like]);
      return res.json(fallbackProjects);
    } else {
      // بدون استعلام بحث، أعِد جميع المشاريع كالمعتاد
      const sql = `SELECT * FROM projects ORDER BY createdAt DESC`;
      const projects = await query(sql);
      return res.json(projects);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'حدث خطأ أثناء جلب المشاريع' });
  }
};

// جلب كافة المشاريع
exports.getProjectsOld = async (req, res) => {
  try {
    const search = req.query.search;
    console.log({ search });
    let projects;

    if (search) {
      // تهيئة نص البحث باستخدام LIKE للبحث الجزئي
      const like = `%${search}%`;
      const sql = `
        SELECT *
        FROM projects
        WHERE title LIKE ?
           OR description LIKE ?
           OR ownerName LIKE ?
        ORDER BY createdAt DESC
      `;
      projects = await query(sql, [like, like, like]);
    } else {
      // بدون معلمة بحث، جلب جميع المشاريع كالمعتاد
      const sql = `SELECT * FROM projects ORDER BY createdAt DESC`;
      projects = await query(sql);
    }

    return res.json(projects);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'حدث خطأ أثناء جلب المشاريع' });
  }
};

// جلب مشروع واحد بواسطة ID
exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const sql = `SELECT * FROM projects WHERE projectId = ?`;
    const projects = await query(sql, [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({ message: 'المشروع غير موجود' });
    }
    return res.json(projects[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'فشل في جلب بيانات المشروع' });
  }
};
