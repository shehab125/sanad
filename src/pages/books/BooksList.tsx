import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../supabaseClient';

interface Book {
  id: string;
  title: string;
  subject: string | null;
  university: string | null;
  price: number;
  condition: string | null;
  description: string | null;
  created_at: string;
}

interface BookWithImage extends Book {
  image_url?: string;
}

const BooksList: React.FC = () => {
  const [books, setBooks] = useState<BookWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*, book_images(image_url)')
        .order('created_at', { ascending: false });
      if (!error && data) {
        const formatted = (data as any[]).map((row) => {
          const img = row.book_images?.[0]?.image_url;
          const { book_images, ...book } = row;
          return { ...book, image_url: img } as BookWithImage;
        });
        setBooks(formatted);
      }
      setLoading(false);
    };
    fetchBooks();
  }, []);

  if (loading) return (
    <div className="page-container">
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">جاري تحميل الكتب...</span>
      </div>
    </div>
  );

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 الكتب</h1>
          <p className="page-subtitle">تصفح وابحث في سوق الكتب الجامعية</p>
        </div>
        <Link to="/books/new" className="btn btn-primary">+ أضف كتابًا</Link>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">لا توجد كتب بعد</div>
          <p className="empty-state-text">كن أول من يضيف كتابًا!</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {books.map((book) => (
            <Link key={book.id} to={`/books/${book.id}`} className="card" style={{ textDecoration: 'none' }}>
              {book.image_url
                ? <img src={book.image_url} alt={book.title} className="card-img" />
                : <div className="card-img-placeholder">📚</div>
              }
              <div className="card-body">
                <div className="card-title">{book.title}</div>
                <div className="card-price">{book.price} جنيه</div>
                <div className="card-meta d-flex gap-1" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {book.condition && (
                    <span className={`badge ${book.condition === 'new' ? 'badge-new' : 'badge-used'}`}>
                      {book.condition === 'new' ? 'جديد' : 'مستعمل'}
                    </span>
                  )}
                  {book.university && <span className="badge badge-accent">{book.university}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksList;