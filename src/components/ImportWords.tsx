import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createNewWord, VocabularyWord } from '@/lib/types';

interface ImportWordsProps {
  onImport: (words: VocabularyWord[]) => void;
  existingWords?: VocabularyWord[];
  className?: string;
}

const EXPECTED_COLUMNS = ['word', 'meaning', 'pronunciation', 'description', 'description_vi', 'example', 'example_vi', 'collocation', 'relatedWords', 'note', 'type', 'level'];

// Dedupe by word only (case-insensitive, trimmed) to block "Apple" vs "apple".
const normalizeKey = (word: string) => word.toLowerCase().trim();

export default function ImportWords({ onImport, existingWords, className }: ImportWordsProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview([]);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setPreview([]);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          setError('File không có dữ liệu.');
          return;
        }

        const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());
        // headers đã được viết thường + trim nên kiểm tra bằng key thường
        if (!headers.includes('word') || !headers.includes('meaning')) {
          setError('File cần có ít nhất 2 cột: "Word" và "Meaning".');
          return;
        }

        const existingKeys = new Set((existingWords ?? []).map(w => normalizeKey(w.word)));

        // Normalize keys
        const normalized = rows.map(row => {
          const obj: Record<string, string> = {};
          for (const [key, val] of Object.entries(row)) {
            obj[key.toLowerCase().trim()] = String(val).trim();
          }
          return obj;
        }).filter(r => r.word && r.meaning);

        const seen = new Set(existingKeys);
        const unique = normalized.filter(r => {
          const key = normalizeKey(r.word);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (unique.length === 0) {
          setError('Không có từ mới để import (trùng hoặc thiếu "Word"/"Meaning").');
          return;
        }

        setPreview(unique);
      } catch {
        setError('Không thể đọc file. Hãy kiểm tra định dạng CSV/Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    const existingKeys = new Set((existingWords ?? []).map(w => normalizeKey(w.word)));
    const seen = new Set(existingKeys);
    const pick = (r: Record<string, string>, keys: string[]) => {
      for (const key of keys) {
        const val = r[key];
        if (val) return val;
      }
      return '';
    };

    const words = preview.reduce<VocabularyWord[]>((acc, row) => {
      const key = normalizeKey(row.word);
      if (seen.has(key)) return acc;
      seen.add(key);

      acc.push(createNewWord({
        word: row.word,
        meaning: row.meaning,
        pronunciation: pick(row, ['pronunciation']),
        description: pick(row, ['description']),
        descriptionVi: pick(row, ['description_vi', 'descriptionvi']),
        example: pick(row, ['example', 'example_sentence']),
        exampleVi: pick(row, ['example_vi', 'examplevi']),
        collocation: pick(row, ['collocation', 'fixed_phrase']),
        relatedWords: pick(row, ['relatedwords', 'related_words']),
        note: pick(row, ['note', 'notes']),
        type: pick(row, ['type']),
        level: pick(row, ['level']),
      }));
      return acc;
    }, []);
    onImport(words);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-accent/40 bg-accent/20 text-amber-800 hover:text-primary-foreground">
          <Upload className="mr-2 h-4 w-4" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Import từ vựng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
            <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium text-foreground">Chọn file CSV hoặc Excel</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Cần có cột <strong>word</strong> và <strong>meaning</strong>. Các cột khác tùy chọn: pronunciation, description, description_vi, example, example_vi, collocation, relatedWords, note, type, level
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFile}
              className="mx-auto block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {preview.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Tìm thấy <strong className="text-foreground">{preview.length}</strong> từ hợp lệ
              </div>

              <div className="max-h-48 overflow-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">Word</th>
                      <th className="px-3 py-2 text-left font-medium">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-1.5 font-medium">{row.word}</td>
                        <td className="px-3 py-1.5">{row.meaning}</td>
                      </tr>
                    ))}
                    {preview.length > 20 && (
                      <tr className="border-t border-border">
                        <td colSpan={3} className="px-3 py-1.5 text-center text-muted-foreground">
                          ...và {preview.length - 20} từ nữa
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Button onClick={handleImport} className="w-full bg-gradient-primary text-[#0F172A]">
                Import {preview.length} từ
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
