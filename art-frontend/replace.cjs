const fs = require('fs');
let code = fs.readFileSync('src/pages/ExplorePage.tsx', 'utf8');
const start = '{/* --- 4. Dark Bento Curatorial Display --- */}';
const end = '{/* --- End Injection --- */}';
const startIdx = code.indexOf(start);
const endIdx = code.indexOf(end);
if (startIdx !== -1 && endIdx !== -1) {
  const newCode = code.slice(0, startIdx) + `{/* --- 4. Art Archive Build Effect --- */}
        <section className="w-full min-h-[70vh] bg-[#f8f6f2] dark:bg-[#071317] rounded-[2rem] p-4 md:p-10 mb-10 shadow-[0_15px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-white/5 relative overflow-hidden flex flex-col items-center justify-center">

          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(rgba(150,150,150,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(150,150,150,0.2) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

          {/* Floating 3D Art Tools (Build Effect) */}
          <motion.div
            initial={{ x: -200, y: -100, rotate: -45, opacity: 0 }}
            whileInView={{ x: '120vw', y: 100, rotate: 45, opacity: [0, 1, 1, 0] }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
            className="absolute z-40 text-8xl md:text-[120px] drop-shadow-2xl pointer-events-none"
            style={{ top: '20%' }}
          >
            ✏️
          </motion.div>
          <motion.div
            initial={{ x: '120vw', y: 200, rotate: 45, opacity: 0 }}
            whileInView={{ x: -200, y: -50, rotate: -45, opacity: [0, 1, 1, 0] }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 3, ease: 'easeInOut', delay: 0.5 }}
            className="absolute z-40 text-8xl md:text-[120px] drop-shadow-2xl pointer-events-none"
            style={{ top: '40%' }}
          >
            🖌️
          </motion.div>

          <div className="relative z-30 flex flex-col items-center mb-16 mt-10">
            <motion.p 
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1 }}
              className="text-[var(--color-primary)] font-mono text-xs uppercase tracking-[0.5em] mb-4 font-bold"
            >
              The Vault
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.2, duration: 0.8 }}
              className="text-6xl md:text-8xl lg:text-[10rem] font-serif-magic italic tracking-tighter leading-none text-slate-900 dark:text-white mb-2 drop-shadow-lg mix-blend-multiply dark:mix-blend-normal"
            >
              ART ARCHIVE
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.5 }}
              className="text-slate-500 dark:text-slate-400 font-light max-w-lg text-center mt-4 tracking-wide text-sm md:text-base italic"
            >
              Every frame is a window. Watch as masterpieces are meticulously rendered into existence.
            </motion.p>
          </div>

          {/* Staggered Floating Frames Gallery */}
          <div className="w-full max-w-6xl relative min-h-[400px] flex flex-wrap justify-center gap-6 z-20 pb-10">
            {artworks.slice(0, 5).map((art, idx) => (
              <motion.div
                key={art._id || idx}
                initial={{ opacity: 0, y: 100, rotateY: 45, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 1, delay: 1.5 + (idx * 0.2), type: 'spring', bounce: 0.4 }}
                whileHover={{ y: -10, scale: 1.05, zIndex: 50 }}
                onClick={() => navigate(\`/art/\${art._id}\`)}
                className={\`relative bg-white p-2 md:p-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.7)] cursor-pointer group border border-gray-200 dark:border-black transform perspective-[1000px] \${
                  idx % 2 === 0 ? '-rotate-2' : 'rotate-3'
                } \${idx === 2 ? 'w-full md:w-[35%] aspect-[4/3] -mt-10 md:-mt-20 z-10' : 'w-[45%] md:w-[25%] aspect-[3/4] z-0'}\`}
              >
                <div className="w-full h-full overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-gray-900">
                  <img
                    src={art.images?.[0]?.startsWith('http') ? art.images[0] : \`http://localhost:5005\${art.images?.[0]}\`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    alt={art.title}
                  />
                  {/* Drawing overlay effect that fades out */}
                  <div className="absolute inset-0 bg-white dark:bg-[#071317] mix-blend-screen dark:mix-blend-multiply opacity-100 group-hover:opacity-0 transition-opacity duration-700" 
                       style={{ backgroundImage: 'url("/real_pencil_architectural_sketch.png")', backgroundSize: 'cover' }} />
                  
                  {/* Hover Details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <span className="text-white font-black drop-shadow-md text-sm truncate">{art.title}</span>
                    <span className="text-[var(--color-primary)] font-bold text-xs">₹{Number(art.price).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- End Injection --- */}` + code.slice(endIdx + end.length);
  fs.writeFileSync('src/pages/ExplorePage.tsx', newCode);
  console.log('Successfully replaced Art Archive section');
} else {
  console.error('Markers not found');
}
