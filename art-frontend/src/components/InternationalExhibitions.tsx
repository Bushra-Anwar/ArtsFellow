import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, MapPin, Calendar, ExternalLink, Search, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InternationalExhibition {
  id: string | number;
  title: string;
  country: string;
  city: string;
  dateStr: string;
  bookingUrl: string;
  tags: string[];
  imageUrl?: string;
  innerDetails: string;
}

interface Props {
  exhibitions: InternationalExhibition[];
}

export const InternationalExhibitions: React.FC<Props> = ({ exhibitions }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  // Extract unique countries for the dropdown
  const uniqueCountries = useMemo(() => {
    const countries = new Set(exhibitions.map((ex) => ex.country));
    return ["All", ...Array.from(countries).sort()];
  }, [exhibitions]);

  // Multi-Criteria Filtering
  const filteredExhibitions = useMemo(() => {
    return exhibitions.filter((ex) => {
      // 1. Country Filter
      if (selectedCountry !== "All" && ex.country !== selectedCountry) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ex.title.toLowerCase().includes(query);
        const matchesCountry = ex.country.toLowerCase().includes(query);
        const matchesCity = ex.city.toLowerCase().includes(query);
        const matchesTags = ex.tags.some((tag) => tag.toLowerCase().includes(query));

        if (!matchesTitle && !matchesCountry && !matchesCity && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [exhibitions, searchQuery, selectedCountry]);

  const toggleExpand = (id: string | number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleBook = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header & Controls */}
      <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">International Exhibitions</h2>
          <p className="mt-2 text-slate-500">Discover and book passes for global art fairs and curated events.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by title, city, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full sm:w-[280px] rounded-full border-0 py-2.5 pl-10 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm sm:leading-6 bg-white/70 backdrop-blur-sm transition-all"
            />
          </div>

          {/* Country Dropdown */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Globe size={18} />
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="block w-full sm:w-[180px] appearance-none rounded-full border-0 py-2.5 pl-10 pr-8 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm sm:leading-6 bg-white/70 backdrop-blur-sm cursor-pointer transition-all"
            >
              {uniqueCountries.map((country) => (
                <option key={country} value={country}>
                  {country === "All" ? "All Countries" : country}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      {filteredExhibitions.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredExhibitions.map((exhibit) => {
            const isExpanded = expandedId === exhibit.id;
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={exhibit.id}
                className="flex flex-col overflow-hidden rounded-[24px] bg-white border border-slate-200 shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-200/50"
              >
                {/* Optional Image Banner */}
                {exhibit.imageUrl && (
                  <div className="h-48 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={exhibit.imageUrl} 
                      alt={exhibit.title} 
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                )}
                
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold leading-tight text-slate-900">{exhibit.title}</h3>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-teal-600 shrink-0" />
                      <span className="truncate">{exhibit.city}, {exhibit.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-teal-600 shrink-0" />
                      <span className="truncate">{exhibit.dateStr}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {exhibit.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {tag}
                      </span>
                    ))}
                    {exhibit.tags.length > 3 && (
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        +{exhibit.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex-1">
                    <button
                      onClick={() => toggleExpand(exhibit.id)}
                      className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? 'Read Less' : 'Show Inner Details'}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-4 text-sm leading-relaxed text-slate-600">
                            {exhibit.innerDetails}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => handleBook(exhibit.bookingUrl)}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-900/20 active:scale-[0.98]"
                    >
                      Book International Pass
                      <ExternalLink size={16} className="opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-slate-50 py-24 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Search size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No exhibitions found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            We couldn't find any exhibitions matching your current search criteria. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
};
