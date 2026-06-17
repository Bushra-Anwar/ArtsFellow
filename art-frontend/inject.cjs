const fs = require('fs');

const extractAndInject = () => {
  try {
    const logStr = fs.readFileSync('C:/Users/boxoffice2/.gemini/antigravity/brain/8315520d-1e4a-4773-a98b-10e0da860ad6/.system_generated/logs/overview.txt', 'utf8');
    
    const vaultStart = logStr.indexOf('{/* --- 4. Art Archive Build Effect --- */}');
    const endInjection = logStr.indexOf('{/* --- End Injection --- */}');
    if (vaultStart === -1 || endInjection === -1) {
      console.log('Sections not found'); return;
    }
    const injectedSections = logStr.substring(vaultStart, endInjection + '{/* --- End Injection --- */}'.length);
    
    const chroniclesStart = logStr.indexOf('{/* CHRONICLES OF THE FIVE WORLDS: THE ULTIMATE HERO GALLERY */}');
    const cinematicEnd = logStr.indexOf('        </section>', logStr.indexOf('{/* 2. Cinematic Showcase Section */}')) + 18;
    const chroniclesAndCinematic = logStr.substring(chroniclesStart, cinematicEnd);
    
    const inquiryStart = logStr.indexOf('{/* Inquiry Modal */}');
    const inquiryEnd = logStr.indexOf(')}', inquiryStart) + 2;
    const inquiryModal = logStr.substring(inquiryStart, inquiryEnd);
    
    let searchContent = fs.readFileSync('C:/Users/boxoffice2/Desktop/First/art-frontend/src/pages/SearchPage.tsx', 'utf8');
    
    if (searchContent.includes('from "lucide-react";')) {
      searchContent = searchContent.replace(
        'from "lucide-react";',
        '  CheckCircle,\n} from "lucide-react";'
      );
    }
    if (!searchContent.includes('PaintStainsBackground')) {
      searchContent = searchContent.replace(
        'import "../components/explore.css";',
        'import "../components/explore.css";\nimport PaintStainsBackground from "../components/PaintStainsBackground";'
      );
    }
    
    if (!searchContent.includes('showArtistPane')) {
      searchContent = searchContent.replace(
        'const [galleryIndex, setGalleryIndex] = useState(0);',
        'const [galleryIndex, setGalleryIndex] = useState(0);\n  const [showArtistPane, setShowArtistPane] = useState(false);\n  const [showInquiryModal, setShowInquiryModal] = useState(false);\n  const [inquiryType, setInquiryType] = useState<"Acquire" | "Pricing">("Acquire");'
      );
    }
    
    if (!searchContent.includes('<PaintStainsBackground')) {
      searchContent = searchContent.replace(
        '<div className="explore-wave left" />',
        '<PaintStainsBackground opacity={0.3} interactive={true} />\n      <div className="explore-wave left" />'
      );
    }

    if (!searchContent.includes('Art Archive Build Effect')) {
      const moodDiscoveryIndex = searchContent.indexOf('<div className="text-xs uppercase tracking-[0.22em] text-slate-400">Mood Discovery</div>');
      if (moodDiscoveryIndex !== -1) {
        const replaceTarget = searchContent.lastIndexOf('<motion.div', moodDiscoveryIndex);
        if (replaceTarget !== -1) {
             const before = searchContent.substring(0, replaceTarget);
             const after = searchContent.substring(replaceTarget);
             searchContent = before + '\n        <div className="mx-auto w-full max-w-[1800px] mb-10">\n          ' + injectedSections + '\n        </div>\n\n        ' + after;
        }
      }
    }

    if (!searchContent.includes('CHRONICLES OF THE FIVE WORLDS')) {
      const splitPoint = searchContent.lastIndexOf('<AnimatePresence>');
      if (splitPoint !== -1) {
           const before = searchContent.substring(0, splitPoint);
           const after = searchContent.substring(splitPoint);
           searchContent = before + '\n      <div className="mx-auto w-full max-w-[1800px]">\n        ' + chroniclesAndCinematic + '\n      </div>\n\n      ' + after;
      }
    }
    
    if (!searchContent.includes('Inquiry Modal')) {
      const lastDivPoint = searchContent.lastIndexOf('</div>\n  );\n};\n\nexport default SearchPage;');
      if (lastDivPoint !== -1) {
          const before = searchContent.substring(0, lastDivPoint);
          const after = searchContent.substring(lastDivPoint);
          searchContent = before + '      ' + inquiryModal + '\n    ' + after;
      }
    }
    
    fs.writeFileSync('C:/Users/boxoffice2/Desktop/First/art-frontend/src/pages/SearchPage.tsx', searchContent);
    console.log('Successfully injected all requested features into SearchPage.tsx!');
  } catch (e) {
    console.error(e);
  }
};
extractAndInject();
