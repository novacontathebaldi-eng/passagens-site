"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function LightboxGallery({ images, title }: { images: string[], title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeLightbox = () => setIsOpen(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div 
            key={i} 
            className="rounded-2xl overflow-hidden aspect-video relative group cursor-pointer"
            onClick={() => openLightbox(i)}
          >
            <img 
              src={img} 
              alt={`${title} - Foto ${i + 1}`} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={closeLightbox}>
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </button>

          <button 
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-3 bg-black/20 rounded-full hover:bg-black/40"
            onClick={prevImage}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button 
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-3 bg-black/20 rounded-full hover:bg-black/40"
            onClick={nextImage}
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div 
            className="relative w-full max-w-5xl h-full max-h-[80vh] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={images[currentIndex]} 
              alt={`${title} - Ampliada ${currentIndex + 1}`} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-white/80 font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
