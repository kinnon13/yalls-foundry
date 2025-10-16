import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ShoppingBag } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground max-w-md">
          The page <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code> doesn't exist.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link to="/search">
            <Button variant="outline" size="lg" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="outline" size="lg" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
