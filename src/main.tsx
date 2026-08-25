import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    storageKey="yatori-theme"
    disableTransitionOnChange
  >
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </ThemeProvider>,
)
