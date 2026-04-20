"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-danger/10 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-primary/10 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      
      <main className="w-full max-w-2xl relative z-10">
        <div className="bg-surface rounded-3xl shadow-xl p-10 md:p-16 flex flex-col items-center text-center relative border border-outline/10">
          
          {/* Illustration Container */}
          <div className="w-full h-64 md:h-80 mb-10 rounded-2xl overflow-hidden relative bg-white flex items-center justify-center shadow-inner">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwKUtDQ4qNd7HNGMxhqMWwffuOgf25scV5SQUR80HVnI6pPMCS1OrnvC_0bLi0E4dg4DcatSBQnaOlk7M8LfU-GmrUm63K5CxEg7XzMTfCs3szDbqayXuEeqHkSxCxAXQt721N_Ry5xZg8XfCy70QfD7I43XY2ZLxbM1LMNbA2tHhcr6quK5-OIrsCmlSZ0Len6UT16oTnNhghneykWocJNoSYe_BVO_CkVih9vEfrk2bjtz-wnJPj6qr7pA1FgV4oBQpS-nw5MGGH"
              alt="Eita, o ônibus enguiçou!"
              className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-multiply"
              style={{ filter: "hue-rotate(320deg)" }} // Muda a cor pra um tom mais avermelhado pra dar ideia de erro
            />
            {/* 500 Badge */}
            <div className="absolute z-10 bg-white/90 backdrop-blur-md px-8 py-3 rounded-full shadow-lg border border-outline/10">
              <span className="text-4xl font-extrabold text-danger">500</span>
            </div>
          </div>
          
          {/* Content Area */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-6 tracking-tight leading-tight">
            Eita, o ônibus enguiçou!
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant mb-12 max-w-lg leading-relaxed">
            Tivemos um problema inesperado na nossa plataforma. Nossa equipe já foi notificada e está resolvendo.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-3 bg-white text-on-surface font-bold text-lg px-8 py-4 rounded-2xl hover:bg-gray-50 border border-outline/20 transition-all duration-300 transform hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tentar Novamente
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 bg-cta text-on-cta font-bold text-lg px-8 py-4 rounded-2xl hover:bg-opacity-90 hover:shadow-glow-cta transition-all duration-300 transform hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ir para Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
