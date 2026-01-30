
import React, { useState, useMemo } from 'react';
import { StorageService } from '../store';
import { translations } from '../translations';
import { User, LibraryBook, LangType } from '../types';

interface LibraryProps {
  books: LibraryBook[];
  user: User;
  lang: LangType;
  onRefresh: () => void;
  onDelete: (id: string, title: string) => void;
  onToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const Library: React.FC<LibraryProps> = ({ books, user, lang, onRefresh, onDelete, onToast }) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);

  const filteredBooks = useMemo(() => 
    books.filter(b => 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [books, searchTerm]
  );

  const isAdmin = user.role === 'admin' || user.role === 'director';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bookData = {
      title: formData.get('title') as string,
      author: formData.get('author') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      url: formData.get('url') as string,
    };

    if (editingBook) {
      StorageService.updateLibraryBook({ ...editingBook, ...bookData });
    } else {
      StorageService.addLibraryBook({
        id: Math.random().toString(36).substr(2, 9),
        ...bookData
      });
    }
    onToast(lang === 'ru' ? 'Библиотека обновлена!' : 'Library updated!', 'success');
    setIsAdding(false);
    setEditingBook(null);
    onRefresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full md:w-1/2">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.search} 
            className="w-full bg-surface border border-muted/10 rounded-2xl pl-14 pr-6 py-4 text-textMain outline-none focus:border-primary transition-all font-black shadow-sm placeholder:text-textMain/40" 
          />
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 neo-button"
          >
            + {t.add_book}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredBooks.map(book => (
          <div key={book.id} className="glass-card rounded-[3rem] p-8 border border-muted/5 shadow-sm hover:shadow-2xl transition-all flex flex-col group relative overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-[2rem] mb-6 flex items-center justify-center text-6xl relative overflow-hidden">
              <span className="relative z-10">📖</span>
              <div className="absolute inset-0 bg-surface/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {isAdmin && (
                <div className="absolute top-6 right-6 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button 
                    onClick={() => { setEditingBook(book); setIsAdding(true); }} 
                    className="w-10 h-10 flex items-center justify-center bg-surface text-primary rounded-xl shadow-xl hover:scale-110 transition-transform border border-muted/10"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => onDelete(book.id, book.title)} 
                    className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-xl hover:scale-110 transition-transform border border-red-500/10"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{book.category}</span>
              <h3 className="text-xl font-black text-textMain truncate tracking-tight">{book.title}</h3>
              <p className="text-xs text-muted font-bold uppercase tracking-widest opacity-60 mb-4">{book.author}</p>
              <p className="text-sm text-muted line-clamp-2 leading-relaxed opacity-80">{book.description}</p>
            </div>
            <a 
              href={book.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-8 w-full text-center py-4 bg-primary/10 text-primary rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              Читать онлайн
            </a>
          </div>
        ))}
        {filteredBooks.length === 0 && <div className="col-span-full py-24 text-center text-muted font-black uppercase tracking-[0.3em] opacity-30">{t.no_data}</div>}
      </div>

      {(isAdding || editingBook) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-surface rounded-[3.5rem] p-12 w-full max-w-lg shadow-2xl border border-muted/10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-3xl font-black text-textMain mb-10 tracking-tighter uppercase">{editingBook ? t.edit : t.add_book}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input 
                name="title" 
                defaultValue={editingBook?.title} 
                required 
                placeholder="Название книги" 
                className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-primary transition-all placeholder:text-textMain/40" 
              />
              
              <input 
                name="author" 
                defaultValue={editingBook?.author} 
                required 
                placeholder={t.author} 
                className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-primary transition-all placeholder:text-textMain/40" 
              />
              
              <input 
                name="category" 
                defaultValue={editingBook?.category} 
                required 
                placeholder={t.category} 
                className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-primary transition-all placeholder:text-muted/40" 
              />
              
              <textarea 
                name="description" 
                defaultValue={editingBook?.description} 
                required 
                placeholder="Краткое аннотирование..." 
                className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-primary transition-all h-32 resize-none placeholder:text-textMain/40" 
              />
              
              <input 
                name="url" 
                defaultValue={editingBook?.url} 
                required 
                type="url" 
                placeholder="Прямая ссылка (https://...)" 
                className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-primary transition-all placeholder:text-muted/40" 
              />
              
              <div className="flex space-x-4 pt-8">
                <button type="button" onClick={() => { setIsAdding(false); setEditingBook(null); }} className="flex-1 py-4 bg-muted/5 text-textMain/70 hover:text-textMain border border-muted/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">{t.cancel}</button>
                <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
