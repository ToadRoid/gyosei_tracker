import type { Subject, Chapter } from '@/types';

export const subjects: Subject[] = [
  { id: 'kenpo', name: '憲法', order: 1 },
  { id: 'gyosei', name: '行政法', order: 2 },
  { id: 'minpo', name: '民法', order: 3 },
  { id: 'shoho', name: '商法', order: 4 },
  { id: 'kiso-hogaku', name: '基礎法学', order: 5 },
  { id: 'kiso-chishiki', name: '基礎知識', order: 6 },
];

export const chapters: Chapter[] = [
  // 憲法
  { id: 'kenpo-soron', subjectId: 'kenpo', name: '総論', order: 1 },
  { id: 'kenpo-jinken', subjectId: 'kenpo', name: '人権', order: 2 },
  { id: 'kenpo-tochi', subjectId: 'kenpo', name: '統治', order: 3 },

  // 行政法
  { id: 'gyosei-ippan', subjectId: 'gyosei', name: '行政法の一般的な法理論', order: 1 },
  { id: 'gyosei-tetsuzuki', subjectId: 'gyosei', name: '行政手続法', order: 2 },
  { id: 'gyosei-fufuku', subjectId: 'gyosei', name: '行政不服審査法', order: 3 },
  { id: 'gyosei-jiken', subjectId: 'gyosei', name: '行政事件訴訟法', order: 4 },
  { id: 'gyosei-kokubai', subjectId: 'gyosei', name: '国家賠償法・損失補償', order: 5 },
  { id: 'gyosei-chiho', subjectId: 'gyosei', name: '地方自治法', order: 6 },

  // 民法
  { id: 'minpo-sosoku', subjectId: 'minpo', name: '総則', order: 1 },
  { id: 'minpo-bukken', subjectId: 'minpo', name: '物権', order: 2 },
  { id: 'minpo-saiken', subjectId: 'minpo', name: '債権', order: 3 },
  { id: 'minpo-shinzoku', subjectId: 'minpo', name: '親族', order: 4 },
  { id: 'minpo-sozoku', subjectId: 'minpo', name: '相続', order: 5 },

  // 商法
  { id: 'shoho-shoho', subjectId: 'shoho', name: '商法', order: 1 },
  { id: 'shoho-kaisha', subjectId: 'shoho', name: '会社法', order: 2 },

  // 基礎法学
  { id: 'kiso-hogaku-gairon', subjectId: 'kiso-hogaku', name: '法学概論', order: 1 },
  { id: 'kiso-hogaku-funso', subjectId: 'kiso-hogaku', name: '紛争解決制度', order: 2 },

  // 基礎知識
  { id: 'kiso-chishiki-ippan', subjectId: 'kiso-chishiki', name: '一般知識', order: 1 },
  { id: 'kiso-chishiki-gyomu', subjectId: 'kiso-chishiki', name: '業務関連諸法令', order: 2 },
  { id: 'kiso-chishiki-joho', subjectId: 'kiso-chishiki', name: '情報通信・個人情報保護', order: 3 },
  { id: 'kiso-chishiki-bunsho', subjectId: 'kiso-chishiki', name: '文章理解', order: 4 },
];
