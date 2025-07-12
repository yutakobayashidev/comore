import { Link, Form } from "react-router";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

type HeaderProps = {
  user: {
    username: string;
    email: string;
    githubId: number;
  } | null;
  isAuthenticated: boolean;
};

export function Header({ user, isAuthenticated }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 container max-w-5xl mx-auto">
        <Link to="/" className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">Comore</h1>
        </Link>
        <nav className="ml-auto flex items-center space-x-4">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  GitHub ID: {user.githubId}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Form method="post">
                    <input type="hidden" name="intent" value="logout" />
                    <button type="submit" className="w-full text-left">
                      Sign Out
                    </button>
                  </Form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login/github">
              <Button variant="default">Login</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
