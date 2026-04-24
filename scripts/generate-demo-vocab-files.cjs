const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const outDir = 'D:/HocTap/Java/minlish-servers/docs/demo-test-data';
fs.mkdirSync(outDir, { recursive: true });

const headers = [
  'word',
  'pronunciation',
  'meaning',
  'description',
  'example_sentence',
  'fixed_phrase',
  'related_words',
  'notes',
];

const rows = [
  ['resilient', '/rɪˈzɪliənt/', 'kiên cường', 'Khả năng phục hồi nhanh sau khó khăn', 'She is resilient after failure.', 'resilient mindset', 'tough; adaptable', 'IELTS Speaking'],
  ['coherent', '/kəʊˈhɪərənt/', 'mạch lạc', 'Trình bày ý tưởng rõ ràng, logic', 'Your argument is coherent and persuasive.', 'coherent response', 'logical; consistent', 'Useful for Writing Task 2'],
  ['sustainable', '/səˈsteɪnəbəl/', 'bền vững', 'Có thể duy trì lâu dài, thân thiện môi trường', 'We need sustainable solutions for big cities.', 'sustainable development', 'eco-friendly; viable', 'Topic: Environment'],
  ['appointment', '/əˈpɔɪntmənt/', 'cuộc hẹn', 'Lịch hẹn với bác sĩ, khách hàng hoặc đối tác', 'I have an appointment at 9 AM tomorrow.', 'book an appointment', 'meeting; schedule', 'Daily conversation'],
  ['thoroughly', '/ˈθʌrəli/', 'một cách kỹ lưỡng', 'Làm việc cẩn thận và đầy đủ chi tiết', 'Please read the contract thoroughly before signing.', 'check thoroughly', 'carefully; completely', 'Common adverb'],
  ['commute', '/kəˈmjuːt/', 'đi lại đi làm', 'Di chuyển hằng ngày giữa nhà và nơi làm việc', 'My daily commute takes about 40 minutes.', 'long commute', 'travel; journey', 'Daily life vocabulary'],
  ['mitigate', '/ˈmɪtɪɡeɪt/', 'giảm nhẹ', 'Làm giảm mức độ nghiêm trọng của vấn đề', 'Policies can mitigate the impact of inflation.', 'mitigate risk', 'alleviate; reduce', 'Academic word'],
  ['eloquent', '/ˈeləkwənt/', 'hùng biện', 'Diễn đạt lưu loát và thuyết phục', 'She gave an eloquent speech about education.', 'eloquent speaker', 'articulate; expressive', 'Presentation skill'],
];

function escapeCsv(value) {
  const s = String(value ?? '');
  return '"' + s.replace(/"/g, '""') + '"';
}

const csvLines = [
  headers.join(','),
  ...rows.map((row) => row.map(escapeCsv).join(',')),
];

const csvPath = path.join(outDir, 'demo_vocab_vi.csv');
fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');

const objects = rows.map((row) =>
  Object.fromEntries(headers.map((header, index) => [header, row[index]]))
);

const worksheet = XLSX.utils.json_to_sheet(objects);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'demo_vocab_vi');

const xlsxPath = path.join(outDir, 'demo_vocab_vi.xlsx');
XLSX.writeFile(workbook, xlsxPath);

console.log('Created:', csvPath);
console.log('Created:', xlsxPath);
