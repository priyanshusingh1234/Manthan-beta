import { useRouter as useExpoRouter, usePathname as useExpoPathname, useLocalSearchParams } from 'expo-router';

export function useRouter() {
  const router = useExpoRouter();
  return {
    push: (url: any) => router.push(url),
    replace: (url: any) => router.replace(url),
    back: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/');
      }
    },
    refresh: () => {}, 
  };
}

export function usePathname() {
  return useExpoPathname();
}

export function useParams() {
  return useLocalSearchParams();
}

export function useSearchParams() {
  const params = useLocalSearchParams();
  return {
    get: (key: string) => {
      const val = params[key];
      if (val === undefined) return null;
      return Array.isArray(val) ? val[0] : val;
    }
  };
}

export function redirect(url: string) {
  const router = useExpoRouter();
  router.replace(url);
}
