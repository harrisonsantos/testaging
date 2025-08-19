/**
 * RootLayout component serves as the main layout for the application.
 * It configures global styling, theme, sidebar visibility, and session management.
 *
 * The session is generated conditionally: in development mode, it uses a mock session;
 * in production, it retrieves the session from the authentication endpoint using getServerSession.
 *
 * Comentário genérico.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Nested components that will be rendered inside the layout.
 * @returns {JSX.Element} The HTML structure of the application's root layout.
 */
import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Providers from "@/app/providers";
import {Toaster} from "sonner";
import QueryProvider from "@/lib/QueryProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import Loading from "@/components/common/Loading";
import useUIStore from "@/stores/useUIStore";
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/auth';


const outfit = Outfit({
    subsets: ['latin'],
});

export default async function RootLayout({ children }) {
    const { isLoading } = useUIStore.getState();

    const session =
    process.env.NODE_ENV === "development"
      ? {
          user: {
            id: "dev",
            name: "Dev User",
            rule: "doctor",
            cpf: "00000000000",
            accessToken: "fake-token",
            profile: "doctor",
            rememberMe: true,
          },
          expires: new Date(Date.now() + 24 * 3600_000).toISOString(),
        }
      : await getServerSession(authOptions)

    return (
        <html lang="en">
        <body className={`${outfit.className} dark:bg-gray-900`}>
            <ErrorBoundary>
                <QueryProvider>
                    <Providers session={session}>
                        {isLoading && <Loading />}
                        <Toaster position="top-center" richColors />
                        <ThemeProvider>
                            <SidebarProvider>{children}</SidebarProvider>
                        </ThemeProvider>
                    </Providers>
                </QueryProvider>
            </ErrorBoundary>
        </body>
        </html>
    );
}
