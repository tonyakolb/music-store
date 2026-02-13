import { useEffect, useState } from 'react';
import { useRef } from 'react';
import * as Tone from 'tone';
import api from './api';

type Item = {
  id: string;
  artist: string;
  title: string;
  likes: number;
  cover: string;
  notes: number[];
};

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [seed, setSeed] = useState('1');
  const [region, setRegion] = useState('en');
  const [likes, setLikes] = useState('1');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'table' | 'gallery'>('table');
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    load(view === 'gallery' ? page === 1 : false);
  }, [seed, region, likes, page, view]);

  useEffect(() => {
    setPage(1);
    if (view === 'gallery') {
      setItems([]);
    }
  }, [seed, region, likes, view]);

  useEffect(() => {
    if (view !== 'gallery') return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [view]);


  const load = async (reset = false) => {
    const res = await api.get('/items', {
      params: { seed, region, likes, page }
    });

    if (view === 'gallery' && !reset) {
      setItems(prev => [...prev, ...res.data.items]);
    } else {
      setItems(res.data.items);
    }
  };

  const playNotes = async (notes: number[]) => {
    await Tone.context.resume();
    
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    const synth = new Tone.Synth().toDestination();

    notes.forEach((note, index) => {
      synth.triggerAttackRelease(
        note,
        "8n",
        Tone.now() + index * 0.3
      );
    });
  };


  return (
    <div style={{ padding: 20 }}>
      <h1>Music Store</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setView('table')}>
          Table
        </button>

        <button
          onClick={() => setView('gallery')}
          style={{ marginLeft: 10 }}
        >
          Gallery
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          value={seed}
          onChange={e => setSeed(e.target.value)}
          placeholder="Seed"
        />

        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="en">English</option>
          <option value="de">German</option>
          <option value="fr">French</option>
        </select>

        <input
          type="text"
          value={likes}
          onChange={e => setLikes(e.target.value)}
          style={{ marginLeft: 10 }}
        />
      </div>

      {view === 'table' ? (
        <>{/*TABLE*/}
          <table border={1} cellPadding={10}>
            <thead>
              <tr>
                <th>Cover</th>
                <th>Artist</th>
                <th>Title</th>
                <th>Likes</th>
                <th>Play</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <img src={item.cover} width={100} />
                  </td>
                  <td>{item.artist}</td>
                  <td>{item.title}</td>
                  <td>{item.likes}</td>
                  <td>
                    <button onClick={() => playNotes(item.notes)}>
                      ▶ Play
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(prev => prev - 1)}
            >
              Previous
            </button>

            <span style={{ margin: '0 10px' }}>
              Page {page}
            </span>

            <button
              onClick={() => setPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <>{/*GALLERY*/}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 20
            }}
          >
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #ccc',
                  padding: 10
                }}
              >
                <img src={item.cover} width="100%" />
                <div><b>{item.title}</b></div>
                <div>{item.artist}</div>
                <div>❤️ {item.likes}</div>
                <button onClick={() => playNotes(item.notes)}>
                  ▶ Play
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <div ref={loaderRef} style={{ height: 20 }} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
