import { StoreConfig } from '@/lib/supabase';
import { Globe, Heart } from 'lucide-react';

interface StoreFooterProps {
  store: StoreConfig;
}

export default function StoreFooter({ store }: StoreFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--store-border)] bg-[var(--store-card)]/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3
              className="text-lg font-bold mb-3"
              style={{ color: store.theme.accent }}
            >
              {store.display_name}
            </h3>
            {store.description && (
              <p className="text-sm text-[var(--store-muted)] leading-relaxed">
                {store.description}
              </p>
            )}
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold text-[var(--store-text)] uppercase tracking-wider mb-3">
              Institucional
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/termos" className="text-sm text-[var(--store-muted)] hover:text-[var(--store-accent)] transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="/privacidade" className="text-sm text-[var(--store-muted)] hover:text-[var(--store-accent)] transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="/contato" className="text-sm text-[var(--store-muted)] hover:text-[var(--store-accent)] transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-bold text-[var(--store-text)] uppercase tracking-wider mb-3">
              Redes Sociais
            </h4>
            <div className="flex gap-3">
              {store.social_links?.instagram && (
                <a
                  href={store.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-[var(--store-bg)] border border-[var(--store-border)] flex items-center justify-center text-[var(--store-muted)] hover:text-[var(--store-accent)] hover:border-[var(--store-accent)] transition-all"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--store-border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--store-muted)]">
            © {currentYear} {store.display_name}. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[var(--store-muted)] flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-red-500" /> por
            <span className="font-semibold" style={{ color: store.theme.accent }}>
              Paulistana Empório
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
