import { PropsWithChildren } from 'react';
import { LucideTaroProvider } from 'lucide-react-taro';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { Preset } from './presets';
import { AuthProvider } from './providers/auth-provider';

const App = ({ children }: PropsWithChildren) => {
  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <AuthProvider>
        <Preset>{children}</Preset>
        <Toaster />
      </AuthProvider>
    </LucideTaroProvider>
  );
};

export default App;
