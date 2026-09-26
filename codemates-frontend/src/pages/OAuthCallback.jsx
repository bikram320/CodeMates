/**
 * src/pages/OAuthCallback.jsx
 *
 * Landing spot for GET /api/auth/github/callback's success redirect
 * (frontend.oauth-success-redirect on the backend should point here:
 * http://localhost:5173/oauth/callback). By the time the browser lands on
 * this page the backend has already set the httpOnly session cookies.
 *
 * This is a fresh page load (GitHub's redirect is a full browser navigation,
 * not a client-side route change), so useAuth()'s own useQuery already
 * fires its session-restore fetch automatically on mount — there is no need
 * to force a second one. An earlier version of this file called a manual
 * refreshUser()/invalidateQueries() here, which fired a second, concurrent
 * POST /api/auth/refresh right on top of that automatic one. Since refresh
 * tokens rotate on every use, two near-simultaneous refresh calls race: the
 * request that loses the race is rejected as using an already-rotated
 * token, and if it resolves last it overwrites the query cache with "logged
 * out" — bouncing straight back to /login. Just reading the query's own
 * isLoading/isAuthenticated state avoids the race entirely.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/ui/Spinner";

export default function OAuthCallback() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return; // still resolving the fresh session-restore fetch
        navigate(isAuthenticated ? "/dashboard" : "/login?error=oauth_failed", { replace: true });
    }, [isLoading, isAuthenticated, navigate]);

    return (
        <div className="flex h-screen items-center justify-center">
            <Spinner size="lg" />
        </div>
    );
}