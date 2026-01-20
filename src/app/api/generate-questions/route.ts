import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  type KnowledgeCategory, 
  type TriviaQuestion,
  type GenerateQuestionsRequest,
  type DifficultyLevel,
  KNOWLEDGE_CATEGORIES 
} from '@/types/game.types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map category IDs to Hebrew names for the prompt
function getCategoryNames(categories: KnowledgeCategory[]): string {
  return categories
    .map(catId => {
      const cat = KNOWLEDGE_CATEGORIES.find(c => c.id === catId);
      return cat ? cat.label : catId;
    })
    .join(', ');
}

// Generate unique ID for each request
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Shuffle array utility (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  // Parse body first so we can use it in error handling
  let body: GenerateQuestionsRequest;
  
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { categories, customCategoryText, questionCount = 100 } = body;

  try {

    // Validate input
    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'יש לבחור לפחות קטגוריה אחת' },
        { status: 400 }
      );
    }

    const categoryNames = getCategoryNames(categories);
    const customTopics = customCategoryText ? `, ${customCategoryText}` : '';

    // Build the prompt for OpenAI
    const systemPrompt = `אתה מומחה ליצירת שאלות טריוויה בעברית לילדים. 
צור שאלות מגוונות, מעניינות ומתאימות לגילאים 8-14.
השאלות צריכות להיות ברורות, מדויקות ומנוסחות בעברית תקינה.`;

    const userPrompt = `צור ${questionCount} שאלות טריוויה בעברית בנושאים: ${categoryNames}${customTopics}.

לכל שאלה יש לכלול:
- טקסט השאלה
- 4 אפשרויות תשובה (אחת נכונה ו-3 שגויות)
- רמת קושי מ-1 עד 5 (1=קל מאוד, 5=קשה מאוד)
- קטגוריה מתוך: ${categories.join(', ')}

חלק את השאלות באופן שווה בין רמות הקושי השונות.
וודא שהתשובות השגויות נשמעות סבירות אך שגויות בבירור.

החזר את התשובה בפורמט JSON בלבד, ללא טקסט נוסף:
{
  "questions": [
    {
      "questionText": "טקסט השאלה",
      "answers": [
        {"text": "תשובה נכונה", "isCorrect": true},
        {"text": "תשובה שגויה 1", "isCorrect": false},
        {"text": "תשובה שגויה 2", "isCorrect": false},
        {"text": "תשובה שגויה 3", "isCorrect": false}
      ],
      "difficulty": 1,
      "category": "history"
    }
  ]
}`;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, using fallback questions');
      const fallbackQuestions = generateFallbackQuestions(categories, questionCount);
      return NextResponse.json({
        success: true,
        questions: fallbackQuestions,
      });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    const parsed = JSON.parse(content);
    
    // Transform to our format with unique IDs
    const questions: TriviaQuestion[] = parsed.questions.map((q: {
      questionText: string;
      answers: { text: string; isCorrect: boolean }[];
      difficulty: number;
      category: string;
    }) => ({
      id: generateId(),
      questionText: q.questionText,
      answers: shuffleArray(q.answers.map((a: { text: string; isCorrect: boolean }) => ({
        id: generateId(),
        text: a.text,
        isCorrect: a.isCorrect,
      }))),
      difficulty: q.difficulty,
      category: q.category,
    }));

    return NextResponse.json({
      success: true,
      questions: shuffleArray(questions),
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    
    // Return fallback questions on error
    const fallbackQuestions = generateFallbackQuestions(categories, questionCount);
    
    return NextResponse.json({
      success: true,
      questions: fallbackQuestions,
    });
  }
}

// Question template type
interface QuestionTemplate {
  questionText: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty: DifficultyLevel;
}

// Large question pool for each category
const QUESTION_TEMPLATES: Record<KnowledgeCategory, QuestionTemplate[]> = {
  history: [
    // Difficulty 1
    { questionText: 'מי היה ראש הממשלה הראשון של ישראל?', correctAnswer: 'דוד בן-גוריון', wrongAnswers: ['חיים וייצמן', 'משה שרת', 'לוי אשכול'], difficulty: 1 },
    { questionText: 'באיזו שנה הוכרזה מדינת ישראל?', correctAnswer: '1948', wrongAnswers: ['1945', '1950', '1947'], difficulty: 1 },
    { questionText: 'מהו צבע הדגל של ישראל?', correctAnswer: 'כחול ולבן', wrongAnswers: ['אדום ולבן', 'ירוק ולבן', 'צהוב וכחול'], difficulty: 1 },
    { questionText: 'מהי בירת ישראל?', correctAnswer: 'ירושלים', wrongAnswers: ['תל אביב', 'חיפה', 'באר שבע'], difficulty: 1 },
    // Difficulty 2
    { questionText: 'מי בנה את הפירמידות במצרים?', correctAnswer: 'המצרים הקדמונים', wrongAnswers: ['הרומאים', 'היוונים', 'הפרסים'], difficulty: 2 },
    { questionText: 'מי היה נשיא ארה"ב הראשון?', correctAnswer: 'ג\'ורג\' וושינגטון', wrongAnswers: ['אברהם לינקולן', 'תומס ג\'פרסון', 'בנג\'מין פרנקלין'], difficulty: 2 },
    { questionText: 'באיזו מדינה נולד נפוליאון?', correctAnswer: 'צרפת (קורסיקה)', wrongAnswers: ['איטליה', 'ספרד', 'גרמניה'], difficulty: 2 },
    { questionText: 'מתי הסתיימה מלחמת העולם השנייה?', correctAnswer: '1945', wrongAnswers: ['1944', '1946', '1943'], difficulty: 2 },
    // Difficulty 3
    { questionText: 'מתי התרחשה מלחמת ששת הימים?', correctAnswer: '1967', wrongAnswers: ['1973', '1956', '1982'], difficulty: 3 },
    { questionText: 'מי גילה את אמריקה?', correctAnswer: 'כריסטופר קולומבוס', wrongAnswers: ['אמריגו וספוצ\'י', 'מרקו פולו', 'פרננדו מגלן'], difficulty: 3 },
    { questionText: 'באיזו שנה נפל חומת ברלין?', correctAnswer: '1989', wrongAnswers: ['1991', '1987', '1985'], difficulty: 3 },
    { questionText: 'מי היה מנהיג הודו שנאבק באלימות?', correctAnswer: 'מהטמה גנדי', wrongAnswers: ['ג\'וואהרלאל נהרו', 'אינדירה גנדי', 'סובהאש צ\'נדרה בוס'], difficulty: 3 },
    // Difficulty 4
    { questionText: 'באיזו שנה התחילה מלחמת העולם הראשונה?', correctAnswer: '1914', wrongAnswers: ['1916', '1912', '1918'], difficulty: 4 },
    { questionText: 'מי המציא את הדפוס?', correctAnswer: 'יוהאן גוטנברג', wrongAnswers: ['לאונרדו דה וינצ\'י', 'תומס אדיסון', 'בנג\'מין פרנקלין'], difficulty: 4 },
    { questionText: 'מתי הייתה המהפכה הצרפתית?', correctAnswer: '1789', wrongAnswers: ['1776', '1799', '1815'], difficulty: 4 },
    { questionText: 'מי היה מלך אנגליה בזמן שייקספיר?', correctAnswer: 'אליזבת הראשונה', wrongAnswers: ['הנרי השמיני', 'ג\'יימס הראשון', 'מרי הראשונה'], difficulty: 4 },
    // Difficulty 5
    { questionText: 'באיזו שנה נחתם הסכם אוסלו?', correctAnswer: '1993', wrongAnswers: ['1991', '1995', '1990'], difficulty: 5 },
    { questionText: 'מי היה קיסר רומא שנרצח בידי הסנאט?', correctAnswer: 'יוליוס קיסר', wrongAnswers: ['אוגוסטוס', 'נירון', 'קליגולה'], difficulty: 5 },
    { questionText: 'באיזו שנה נוסד האו"ם?', correctAnswer: '1945', wrongAnswers: ['1948', '1939', '1950'], difficulty: 5 },
    { questionText: 'מי הנהיג את צבא יוון נגד פרס בקרב תרמופילאי?', correctAnswer: 'לאונידס', wrongAnswers: ['אלכסנדר', 'פריקלס', 'תמיסטוקלס'], difficulty: 5 },
  ],
  sport: [
    // Difficulty 1
    { questionText: 'כמה שחקנים יש בקבוצת כדורגל?', correctAnswer: '11', wrongAnswers: ['10', '9', '12'], difficulty: 1 },
    { questionText: 'באיזה צבע הכדור בטניס שולחן?', correctAnswer: 'לבן או כתום', wrongAnswers: ['צהוב', 'ירוק', 'אדום'], difficulty: 1 },
    { questionText: 'מהו הספורט הפופולרי בעולם?', correctAnswer: 'כדורגל', wrongAnswers: ['כדורסל', 'טניס', 'קריקט'], difficulty: 1 },
    { questionText: 'כמה שחקנים משחקים במשחק שחמט?', correctAnswer: '2', wrongAnswers: ['4', '3', '1'], difficulty: 1 },
    // Difficulty 2
    { questionText: 'באיזו מדינה המציאו את הכדורגל?', correctAnswer: 'אנגליה', wrongAnswers: ['ברזיל', 'ספרד', 'איטליה'], difficulty: 2 },
    { questionText: 'כמה נקודות שווה סל בכדורסל?', correctAnswer: '2 או 3', wrongAnswers: ['1', '4', '5'], difficulty: 2 },
    { questionText: 'מהו משך משחק כדורגל רגיל?', correctAnswer: '90 דקות', wrongAnswers: ['60 דקות', '120 דקות', '45 דקות'], difficulty: 2 },
    { questionText: 'באיזה ספורט יש "סט" ו"גיים"?', correctAnswer: 'טניס', wrongAnswers: ['כדורעף', 'בדמינטון', 'סקווש'], difficulty: 2 },
    // Difficulty 3
    { questionText: 'כמה טבעות יש בסמל האולימפיאדה?', correctAnswer: '5', wrongAnswers: ['4', '6', '3'], difficulty: 3 },
    { questionText: 'באיזו עיר התקיימו המשחקים האולימפיים ב-2020?', correctAnswer: 'טוקיו', wrongAnswers: ['פריז', 'לונדון', 'ריו'], difficulty: 3 },
    { questionText: 'מי זכה הכי הרבה פעמים במונדיאל?', correctAnswer: 'ברזיל', wrongAnswers: ['גרמניה', 'איטליה', 'ארגנטינה'], difficulty: 3 },
    { questionText: 'כמה סטים צריך לנצח בטניס גברים בגרנד סלאם?', correctAnswer: '3 מתוך 5', wrongAnswers: ['2 מתוך 3', '4 מתוך 7', '3 מתוך 3'], difficulty: 3 },
    // Difficulty 4
    { questionText: 'מהו המרחק במרתון?', correctAnswer: '42.195 ק"מ', wrongAnswers: ['40 ק"מ', '45 ק"מ', '38 ק"מ'], difficulty: 4 },
    { questionText: 'מי החזיק בשיא ריצת 100 מטר הכי הרבה זמן?', correctAnswer: 'אוסיין בולט', wrongAnswers: ['קרל לואיס', 'טייסון גיי', 'יוהאן בלייק'], difficulty: 4 },
    { questionText: 'באיזה משקל נלחם מוחמד עלי?', correctAnswer: 'משקל כבד', wrongAnswers: ['משקל בינוני', 'משקל קל', 'משקל נוצה'], difficulty: 4 },
    { questionText: 'כמה שערים כבש פלה בקריירה שלו?', correctAnswer: 'מעל 1000', wrongAnswers: ['מעל 500', 'מעל 750', 'מעל 1200'], difficulty: 4 },
    // Difficulty 5
    { questionText: 'באיזה ספורט משתמשים במחבט ובכדור קטן צהוב?', correctAnswer: 'טניס', wrongAnswers: ['בדמינטון', 'סקווש', 'פינג פונג'], difficulty: 5 },
    { questionText: 'מי זכה הכי הרבה פעמים באליפות ווימבלדון גברים?', correctAnswer: 'רוג\'ר פדרר', wrongAnswers: ['רפאל נדאל', 'נובאק דג\'וקוביץ\'', 'פיט סמפרס'], difficulty: 5 },
    { questionText: 'באיזו שנה התקיימו המשחקים האולימפיים הראשונים המודרניים?', correctAnswer: '1896', wrongAnswers: ['1900', '1888', '1904'], difficulty: 5 },
    { questionText: 'מהי המדינה עם הכי הרבה מדליות אולימפיות בהיסטוריה?', correctAnswer: 'ארה"ב', wrongAnswers: ['סין', 'רוסיה', 'בריטניה'], difficulty: 5 },
  ],
  bible: [
    // Difficulty 1
    { questionText: 'מי בנה את תיבת נוח?', correctAnswer: 'נוח', wrongAnswers: ['אברהם', 'משה', 'דוד'], difficulty: 1 },
    { questionText: 'כמה ימים ארך בריאת העולם?', correctAnswer: '6 ימים', wrongAnswers: ['7 ימים', '5 ימים', '10 ימים'], difficulty: 1 },
    { questionText: 'מי היה האדם הראשון?', correctAnswer: 'אדם', wrongAnswers: ['נוח', 'אברהם', 'משה'], difficulty: 1 },
    { questionText: 'מהו שם האישה הראשונה?', correctAnswer: 'חווה', wrongAnswers: ['שרה', 'רבקה', 'רחל'], difficulty: 1 },
    // Difficulty 2
    { questionText: 'כמה מכות היו במצרים?', correctAnswer: '10', wrongAnswers: ['7', '12', '5'], difficulty: 2 },
    { questionText: 'מי נלחם בגוליית?', correctAnswer: 'דוד', wrongAnswers: ['שאול', 'שמשון', 'יהושע'], difficulty: 2 },
    { questionText: 'כמה בנים היו ליעקב?', correctAnswer: '12', wrongAnswers: ['10', '7', '13'], difficulty: 2 },
    { questionText: 'מי נמכר לעבד על ידי אחיו?', correctAnswer: 'יוסף', wrongAnswers: ['בנימין', 'יהודה', 'ראובן'], difficulty: 2 },
    // Difficulty 3
    { questionText: 'מי קיבל את לוחות הברית בהר סיני?', correctAnswer: 'משה', wrongAnswers: ['אהרון', 'יהושע', 'אברהם'], difficulty: 3 },
    { questionText: 'כמה שנים שהה עם ישראל במדבר?', correctAnswer: '40 שנה', wrongAnswers: ['30 שנה', '50 שנה', '20 שנה'], difficulty: 3 },
    { questionText: 'מי הרג את שמשון?', correctAnswer: 'הפלשתים (לאחר בגידת דלילה)', wrongAnswers: ['המצרים', 'הכנענים', 'העמלקים'], difficulty: 3 },
    { questionText: 'מי היה אחיו של משה?', correctAnswer: 'אהרון', wrongAnswers: ['יהושע', 'כלב', 'קורח'], difficulty: 3 },
    // Difficulty 4
    { questionText: 'מי היה המלך החכם ביותר?', correctAnswer: 'שלמה', wrongAnswers: ['דוד', 'שאול', 'חזקיהו'], difficulty: 4 },
    { questionText: 'מי בנה את בית המקדש הראשון?', correctAnswer: 'שלמה', wrongAnswers: ['דוד', 'הורדוס', 'נחמיה'], difficulty: 4 },
    { questionText: 'מי היה הנביא שעלה בסערה השמימה?', correctAnswer: 'אליהו', wrongAnswers: ['אלישע', 'ישעיהו', 'ירמיהו'], difficulty: 4 },
    { questionText: 'כמה ספרים יש בתנ"ך?', correctAnswer: '24', wrongAnswers: ['22', '27', '39'], difficulty: 4 },
    // Difficulty 5
    { questionText: 'כמה שבטים יש לעם ישראל?', correctAnswer: '12', wrongAnswers: ['10', '7', '13'], difficulty: 5 },
    { questionText: 'מי היה השופט הראשון של ישראל?', correctAnswer: 'עתניאל בן קנז', wrongAnswers: ['דבורה', 'גדעון', 'שמשון'], difficulty: 5 },
    { questionText: 'באיזה ספר מסופר על יציאת מצרים?', correctAnswer: 'שמות', wrongAnswers: ['בראשית', 'ויקרא', 'במדבר'], difficulty: 5 },
    { questionText: 'מי הייתה אשתו של אברהם?', correctAnswer: 'שרה', wrongAnswers: ['רבקה', 'רחל', 'לאה'], difficulty: 5 },
  ],
  culture: [
    // Difficulty 1
    { questionText: 'באיזה כלי נגן מנגנים בעזרת קשת?', correctAnswer: 'כינור', wrongAnswers: ['גיטרה', 'פסנתר', 'חליל'], difficulty: 1 },
    { questionText: 'מהו הצבע שמתקבל מערבוב אדום וכחול?', correctAnswer: 'סגול', wrongAnswers: ['ירוק', 'כתום', 'חום'], difficulty: 1 },
    { questionText: 'כמה צלילים יש בסולם המוזיקלי?', correctAnswer: '7', wrongAnswers: ['5', '8', '6'], difficulty: 1 },
    { questionText: 'מי יצר את מיקי מאוס?', correctAnswer: 'וולט דיסני', wrongAnswers: ['סטיבן ספילברג', 'פיקסר', 'וורנר ברוס'], difficulty: 1 },
    // Difficulty 2
    { questionText: 'מי צייר את המונה ליזה?', correctAnswer: 'לאונרדו דה וינצ\'י', wrongAnswers: ['מיכלאנג\'לו', 'פיקאסו', 'ואן גוך'], difficulty: 2 },
    { questionText: 'באיזו עיר נמצא מגדל אייפל?', correctAnswer: 'פריז', wrongAnswers: ['לונדון', 'רומא', 'ברלין'], difficulty: 2 },
    { questionText: 'מי הלחין את "לאליזה"?', correctAnswer: 'בטהובן', wrongAnswers: ['מוצרט', 'באך', 'שופן'], difficulty: 2 },
    { questionText: 'מהו שם הדמות הראשית ב"הארי פוטר"?', correctAnswer: 'הארי פוטר', wrongAnswers: ['רון ויזלי', 'הרמיוני גריינג\'ר', 'דרקו מאלפוי'], difficulty: 2 },
    // Difficulty 3
    { questionText: 'מי כתב את "הארי פוטר"?', correctAnswer: 'ג\'יי קיי רולינג', wrongAnswers: ['סטיבן קינג', 'ג\'ורג\' מרטין', 'טולקין'], difficulty: 3 },
    { questionText: 'באיזו מדינה נמצא המוזיאון הלובר?', correctAnswer: 'צרפת', wrongAnswers: ['איטליה', 'ספרד', 'בריטניה'], difficulty: 3 },
    { questionText: 'מי צייר את "ליל הכוכבים"?', correctAnswer: 'ואן גוך', wrongAnswers: ['מונה', 'פיקאסו', 'דאלי'], difficulty: 3 },
    { questionText: 'מי הלחין את "ברבור האגם"?', correctAnswer: 'צ\'ייקובסקי', wrongAnswers: ['בטהובן', 'מוצרט', 'באך'], difficulty: 3 },
    // Difficulty 4
    { questionText: 'מי כתב את "הנסיך הקטן"?', correctAnswer: 'אנטואן דה סנט-אכזופרי', wrongAnswers: ['רואלד דאל', 'אסטריד לינדגרן', 'לואיס קרול'], difficulty: 4 },
    { questionText: 'מי פיסל את פסל דוד?', correctAnswer: 'מיכלאנג\'לו', wrongAnswers: ['דונטלו', 'ברניני', 'רודן'], difficulty: 4 },
    { questionText: 'באיזו שנה יצא הסרט "שלג לבן" של דיסני?', correctAnswer: '1937', wrongAnswers: ['1940', '1950', '1933'], difficulty: 4 },
    { questionText: 'מי כתב את "רומיאו ויוליה"?', correctAnswer: 'ויליאם שייקספיר', wrongAnswers: ['צ\'ארלס דיקנס', 'ג\'יין אוסטן', 'אוסקר ויילד'], difficulty: 4 },
    // Difficulty 5
    { questionText: 'מהי בירת האופנה של העולם?', correctAnswer: 'פריז', wrongAnswers: ['מילאנו', 'ניו יורק', 'לונדון'], difficulty: 5 },
    { questionText: 'מי הלחין את "ארבע העונות"?', correctAnswer: 'ויוואלדי', wrongAnswers: ['באך', 'הנדל', 'מוצרט'], difficulty: 5 },
    { questionText: 'באיזו עיר נמצא תיאטרון לה סקאלה?', correctAnswer: 'מילאנו', wrongAnswers: ['רומא', 'ונציה', 'פירנצה'], difficulty: 5 },
    { questionText: 'מי כתב את "מלחמה ושלום"?', correctAnswer: 'לב טולסטוי', wrongAnswers: ['דוסטויבסקי', 'צ\'כוב', 'פושקין'], difficulty: 5 },
  ],
  geography: [
    // Difficulty 1
    { questionText: 'כמה יבשות יש בעולם?', correctAnswer: '7', wrongAnswers: ['6', '5', '8'], difficulty: 1 },
    { questionText: 'מהו האוקיינוס הגדול בעולם?', correctAnswer: 'האוקיינוס השקט', wrongAnswers: ['האטלנטי', 'ההודי', 'הארקטי'], difficulty: 1 },
    { questionText: 'מהי היבשת הקרה ביותר?', correctAnswer: 'אנטארקטיקה', wrongAnswers: ['אסיה', 'אירופה', 'צפון אמריקה'], difficulty: 1 },
    { questionText: 'באיזו יבשת נמצאת ישראל?', correctAnswer: 'אסיה', wrongAnswers: ['אפריקה', 'אירופה', 'אוסטרליה'], difficulty: 1 },
    // Difficulty 2
    { questionText: 'מהו ההר הגבוה בעולם?', correctAnswer: 'אוורסט', wrongAnswers: ['קילימנג\'רו', 'מון בלאן', 'K2'], difficulty: 2 },
    { questionText: 'מהי המדינה הגדולה בעולם?', correctAnswer: 'רוסיה', wrongAnswers: ['קנדה', 'סין', 'ארה"ב'], difficulty: 2 },
    { questionText: 'מהי בירת אנגליה?', correctAnswer: 'לונדון', wrongAnswers: ['מנצ\'סטר', 'ברמינגהם', 'ליברפול'], difficulty: 2 },
    { questionText: 'באיזו יבשת נמצאת מצרים?', correctAnswer: 'אפריקה', wrongAnswers: ['אסיה', 'אירופה', 'דרום אמריקה'], difficulty: 2 },
    // Difficulty 3
    { questionText: 'מהו הנהר הארוך בעולם?', correctAnswer: 'הנילוס', wrongAnswers: ['האמזונס', 'המיסיסיפי', 'הינגצה'], difficulty: 3 },
    { questionText: 'באיזו מדינה נמצא מגדל פיזה הנטוי?', correctAnswer: 'איטליה', wrongAnswers: ['ספרד', 'צרפת', 'יוון'], difficulty: 3 },
    { questionText: 'מהי המדבר הגדול בעולם?', correctAnswer: 'סהרה', wrongAnswers: ['גובי', 'ערב', 'קלהרי'], difficulty: 3 },
    { questionText: 'כמה מדינות יש באיחוד האירופי (2024)?', correctAnswer: '27', wrongAnswers: ['25', '30', '28'], difficulty: 3 },
    // Difficulty 4
    { questionText: 'מהי הממלכה הקטנה בעולם?', correctAnswer: 'הוותיקן', wrongAnswers: ['מונקו', 'סן מרינו', 'ליכטנשטיין'], difficulty: 4 },
    { questionText: 'באיזו יבשת נמצאת ברזיל?', correctAnswer: 'דרום אמריקה', wrongAnswers: ['צפון אמריקה', 'אפריקה', 'אירופה'], difficulty: 4 },
    { questionText: 'מהו הים הסגור הגדול בעולם?', correctAnswer: 'הים הכספי', wrongAnswers: ['ים המלח', 'אגם ויקטוריה', 'אגם סופריור'], difficulty: 4 },
    { questionText: 'באיזו מדינה יש הכי הרבה אנשים?', correctAnswer: 'הודו', wrongAnswers: ['סין', 'ארה"ב', 'אינדונזיה'], difficulty: 4 },
    // Difficulty 5
    { questionText: 'מהי בירת אוסטרליה?', correctAnswer: 'קנברה', wrongAnswers: ['סידני', 'מלבורן', 'פרת\''], difficulty: 5 },
    { questionText: 'כמה מדינות יש בעולם (משוער)?', correctAnswer: 'כ-195', wrongAnswers: ['כ-150', 'כ-220', 'כ-180'], difficulty: 5 },
    { questionText: 'מהי המדינה היחידה שחולקת גבול עם 14 מדינות?', correctAnswer: 'רוסיה', wrongAnswers: ['סין', 'ברזיל', 'הודו'], difficulty: 5 },
    { questionText: 'באיזו מדינה נמצא מפל ניאגרה?', correctAnswer: 'קנדה וארה"ב', wrongAnswers: ['ברזיל', 'ארגנטינה', 'ונצואלה'], difficulty: 5 },
  ],
  science: [
    // Difficulty 1
    { questionText: 'כמה כוכבי לכת יש במערכת השמש?', correctAnswer: '8', wrongAnswers: ['9', '7', '10'], difficulty: 1 },
    { questionText: 'מהו כוכב הלכת הקרוב לשמש?', correctAnswer: 'כוכב חמה', wrongAnswers: ['נוגה', 'מאדים', 'צדק'], difficulty: 1 },
    { questionText: 'כמה רגליים יש לעכביש?', correctAnswer: '8', wrongAnswers: ['6', '10', '4'], difficulty: 1 },
    { questionText: 'מהו האיבר הגדול ביותר בגוף?', correctAnswer: 'העור', wrongAnswers: ['הכבד', 'הלב', 'המוח'], difficulty: 1 },
    // Difficulty 2
    { questionText: 'מהו היסוד הנפוץ ביותר ביקום?', correctAnswer: 'מימן', wrongAnswers: ['חמצן', 'פחמן', 'הליום'], difficulty: 2 },
    { questionText: 'כמה שיניים יש לאדם בוגר?', correctAnswer: '32', wrongAnswers: ['28', '30', '34'], difficulty: 2 },
    { questionText: 'מי המציא את הטלפון?', correctAnswer: 'אלכסנדר גרהם בל', wrongAnswers: ['תומס אדיסון', 'ניקולה טסלה', 'מרקוני'], difficulty: 2 },
    { questionText: 'כמה עצמות יש בגוף האדם הבוגר?', correctAnswer: '206', wrongAnswers: ['200', '210', '196'], difficulty: 2 },
    // Difficulty 3
    { questionText: 'מהי הנוסחה הכימית של מים?', correctAnswer: 'H2O', wrongAnswers: ['CO2', 'O2', 'NaCl'], difficulty: 3 },
    { questionText: 'מי גילה את כוח הכבידה?', correctAnswer: 'אייזק ניוטון', wrongAnswers: ['אלברט איינשטיין', 'גלילאו', 'קופרניקוס'], difficulty: 3 },
    { questionText: 'מהי מהירות האור בקירוב?', correctAnswer: '300,000 ק"מ בשנייה', wrongAnswers: ['150,000 ק"מ בשנייה', '500,000 ק"מ בשנייה', '1,000,000 ק"מ בשנייה'], difficulty: 3 },
    { questionText: 'מהו החיסון הראשון שהומצא?', correctAnswer: 'חיסון לאבעבועות', wrongAnswers: ['חיסון לפוליו', 'חיסון לשפעת', 'חיסון לחצבת'], difficulty: 3 },
    // Difficulty 4
    { questionText: 'מהו כוכב הלכת הגדול במערכת השמש?', correctAnswer: 'צדק', wrongAnswers: ['שבתאי', 'אורנוס', 'נפטון'], difficulty: 4 },
    { questionText: 'מי פיתח את תורת היחסות?', correctAnswer: 'אלברט איינשטיין', wrongAnswers: ['ניוטון', 'הוקינג', 'בור'], difficulty: 4 },
    { questionText: 'מהי יחידת המידה לכוח?', correctAnswer: 'ניוטון', wrongAnswers: ['ג\'אול', 'וואט', 'פסקל'], difficulty: 4 },
    { questionText: 'כמה כרומוזומים יש לאדם?', correctAnswer: '46', wrongAnswers: ['44', '48', '42'], difficulty: 4 },
    // Difficulty 5
    { questionText: 'מי גילה את הפניצילין?', correctAnswer: 'אלכסנדר פלמינג', wrongAnswers: ['לואי פסטר', 'רוברט קוך', 'אדוארד ג\'נר'], difficulty: 5 },
    { questionText: 'מהו המספר האטומי של זהב?', correctAnswer: '79', wrongAnswers: ['47', '82', '29'], difficulty: 5 },
    { questionText: 'מהי הטמפרטורה של אפס מוחלט בצלזיוס?', correctAnswer: '-273.15', wrongAnswers: ['-100', '-460', '0'], difficulty: 5 },
    { questionText: 'מי פיתח את תורת האבולוציה?', correctAnswer: 'צ\'ארלס דרווין', wrongAnswers: ['גרגור מנדל', 'לואי פסטר', 'קרל לינאוס'], difficulty: 5 },
  ],
  other: [
    // Difficulty 1
    { questionText: 'כמה ימים יש בשנה רגילה?', correctAnswer: '365', wrongAnswers: ['360', '366', '364'], difficulty: 1 },
    { questionText: 'מהו הפרי הנפוץ ביותר בעולם?', correctAnswer: 'עגבנייה', wrongAnswers: ['תפוח', 'בננה', 'תפוז'], difficulty: 1 },
    { questionText: 'כמה שעות יש ביום?', correctAnswer: '24', wrongAnswers: ['12', '20', '30'], difficulty: 1 },
    { questionText: 'מהו החודש הראשון בשנה?', correctAnswer: 'ינואר', wrongAnswers: ['מרץ', 'ספטמבר', 'דצמבר'], difficulty: 1 },
    // Difficulty 2
    { questionText: 'כמה דקות יש בשעה?', correctAnswer: '60', wrongAnswers: ['100', '50', '30'], difficulty: 2 },
    { questionText: 'מהו החג היהודי הראשון בשנה העברית?', correctAnswer: 'ראש השנה', wrongAnswers: ['פסח', 'סוכות', 'חנוכה'], difficulty: 2 },
    { questionText: 'כמה צבעים יש בקשת?', correctAnswer: '7', wrongAnswers: ['5', '6', '8'], difficulty: 2 },
    { questionText: 'מהו החיה הגדולה ביותר בעולם?', correctAnswer: 'לוויתן כחול', wrongAnswers: ['פיל', 'ג\'ירפה', 'כריש לבן'], difficulty: 2 },
    // Difficulty 3
    { questionText: 'כמה ימים יש בשנה מעוברת?', correctAnswer: '366', wrongAnswers: ['365', '364', '367'], difficulty: 3 },
    { questionText: 'מהו הממטיר הכי גדול בעולם?', correctAnswer: 'קיטור', wrongAnswers: ['אריה', 'זאב', 'נמר'], difficulty: 3 },
    { questionText: 'כמה מיליליטר יש בליטר?', correctAnswer: '1000', wrongAnswers: ['100', '500', '10000'], difficulty: 3 },
    { questionText: 'מהו הציפור המהירה ביותר?', correctAnswer: 'בז נודד', wrongAnswers: ['נשר', 'יען', 'פינגווין'], difficulty: 3 },
    // Difficulty 4
    { questionText: 'מהי השפה הנפוצה ביותר בעולם?', correctAnswer: 'אנגלית (כשפה שנייה)', wrongAnswers: ['סינית', 'ספרדית', 'ערבית'], difficulty: 4 },
    { questionText: 'כמה סנטימטר יש במטר?', correctAnswer: '100', wrongAnswers: ['10', '1000', '50'], difficulty: 4 },
    { questionText: 'מהו המתכת היקרה ביותר?', correctAnswer: 'רודיום', wrongAnswers: ['זהב', 'פלטינום', 'כסף'], difficulty: 4 },
    { questionText: 'באיזה חודש חוגגים את חנוכה?', correctAnswer: 'כסלו', wrongAnswers: ['טבת', 'אדר', 'ניסן'], difficulty: 4 },
    // Difficulty 5
    { questionText: 'כמה גרם יש בקילוגרם?', correctAnswer: '1000', wrongAnswers: ['100', '10000', '500'], difficulty: 5 },
    { questionText: 'מהו יום העצמאות של ישראל בתאריך העברי?', correctAnswer: 'ה\' באייר', wrongAnswers: ['י"ד בניסן', 'י"ז בתמוז', 'ט\' באב'], difficulty: 5 },
    { questionText: 'מהי המדינה עם הכי הרבה שפות רשמיות?', correctAnswer: 'דרום אפריקה (11)', wrongAnswers: ['הודו', 'שווייץ', 'בלגיה'], difficulty: 5 },
    { questionText: 'מהו המספר הראשוני הגדול ביותר מתחת ל-100?', correctAnswer: '97', wrongAnswers: ['99', '91', '89'], difficulty: 5 },
  ],
};

// Generate fallback questions when API is not available
function generateFallbackQuestions(categories: KnowledgeCategory[], count: number): TriviaQuestion[] {
  const allQuestions: TriviaQuestion[] = [];
  
  // Collect all questions from selected categories
  for (const category of categories) {
    const templates = QUESTION_TEMPLATES[category] || [];
    for (const template of templates) {
      // Create question with shuffled answers and unique ID
      const answers = shuffleArray([
        { id: generateId(), text: template.correctAnswer, isCorrect: true },
        ...template.wrongAnswers.map(wrong => ({ id: generateId(), text: wrong, isCorrect: false }))
      ]);
      
      allQuestions.push({
        id: generateId(),
        questionText: template.questionText,
        answers,
        difficulty: template.difficulty,
        category,
      });
    }
  }
  
  // Shuffle all questions
  const shuffled = shuffleArray(allQuestions);
  
  // If we don't have enough questions, duplicate and modify
  while (shuffled.length < count) {
    const originalLength = shuffled.length;
    for (let i = 0; i < originalLength && shuffled.length < count; i++) {
      const original = shuffled[i];
      shuffled.push({
        ...original,
        id: generateId(), // New unique ID
        answers: shuffleArray(original.answers.map(a => ({ ...a, id: generateId() }))),
      });
    }
  }
  
  // Return requested count
  return shuffled.slice(0, count);
}
