import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

app.post('/api/scan-document', async (req, res) => {
  try {
    const { fileData, mimeType, categoryHint } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'لم يتم إرسال بيانات الملف الضوئي' });
    }

    const cleanBase64 = fileData.replace(/^data:(.*);base64,/, '');
    const effectiveMimeType = mimeType || 'image/png';

    const ai = getGenAI();

    const prompt = `
أنت خبير واستشاري في قراءة وتحليل المستندات الإدارية، التقارير الطبية، أذونات الخروج، والمأموريات الرسمية لشركات ومؤسسات العمل.
قم بقراءة وتحليل الصورة / مستند PDF المرفق بدقة متناهية واستخراج جميع البيانات منه وإرجاع النتيجة بصيغة JSON متوافقة مع المخطط المرفق.

المطلوب استخراجه:
1. نوع المستند (documentType): اختر الأنسب بين ('إجازة مرضية / تقرير طبي', 'طلب إجازة اعتادية / سنوية', 'إذن خروج / مأمورية رسمية', 'مستند إثبات حضور / هويّة', 'غير ذلك').
2. التصنيف الرئيسي (category): 'VACATION' أو 'SICK_LEAVE' أو 'MISSION' أو 'GENERAL'.
3. اسم الموظف المرشح (employeeNameCandidate): الاسم الكامل للموظف الموجود في المستند إن وجد.
4. كود الموظف أو رقم البصمة (employeeCodeCandidate): الرقم الوظيفي أو كود البصمة إن وجد.
5. تاريخ المستند (documentDate): تاريخ إصدار المستند بصيغة (YYYY-MM-DD).
6. تاريخ بداية الإجازة / المأمورية (startDate): صيغة (YYYY-MM-DD) إن وجد.
7. تاريخ نهاية الإجازة / المأمورية (endDate): صيغة (YYYY-MM-DD) إن وجد.
8. عدد الأيام أو الساعات (daysOrHoursCount): الرقم فقط أو نص توضيحي (مثال: "3 أيام" أو "2 ساعة").
9. وقت المغادرة (departureTime): وقت بداية المأمورية أو الخروج بصيغة (HH:mm) إن وجد.
10. وقت العودة المتوقع (returnTime): وقت العودة بصيغة (HH:mm) إن وجد.
11. السبب أو التشخيص الطبي (reasonOrDiagnosis): تفاصيل السبب، المأمورية، أو التشخيص الطبي المكتوب.
12. الجهة المصدرة (issuingAuthority): اسم المستشفى، الطبيب، الإدارة، أو الجهة الخارجية.
13. رقم السجل أو التقرير (referenceNumber): الرقم المرجعي أو الرقم المسلسل للتقرير/الإذن إن وجد.
14. اسم المعتمد/المدير (approvedByCandidate): اسم الشخص المعتمد أو الطبيب المكتوب.
15. ملخص باللغة العربية (summaryArabic): ملخص وجيز ومحكم لما يتضمنه المستند.
16. نسبة الثقة (confidenceScore): 'HIGH' أو 'MEDIUM' أو 'LOW'.

تلميح الفئة المطلوب البحث عنها: ${categoryHint || 'عام'}
تنبيه: إذا كان المستند غير واضح بالكامل، حاول استخراج النص المتوفر بمرونة.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: effectiveMimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING },
            category: { type: Type.STRING },
            employeeNameCandidate: { type: Type.STRING },
            employeeCodeCandidate: { type: Type.STRING },
            documentDate: { type: Type.STRING },
            startDate: { type: Type.STRING },
            endDate: { type: Type.STRING },
            daysOrHoursCount: { type: Type.STRING },
            departureTime: { type: Type.STRING },
            returnTime: { type: Type.STRING },
            reasonOrDiagnosis: { type: Type.STRING },
            issuingAuthority: { type: Type.STRING },
            referenceNumber: { type: Type.STRING },
            approvedByCandidate: { type: Type.STRING },
            summaryArabic: { type: Type.STRING },
            confidenceScore: { type: Type.STRING },
          },
          required: ['documentType', 'category', 'summaryArabic'],
        },
      },
    });

    const resultText = response.text || '{}';
    const parsedData = JSON.parse(resultText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('OCR Scanner API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء معالجة المستند بالماسح الضوئي الذكي',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
