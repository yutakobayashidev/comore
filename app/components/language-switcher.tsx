import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentLanguage = i18n.language;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} asChild>
            <Link
              to={`${location.pathname}?lng=${lang.code}`}
              className={currentLanguage === lang.code ? "font-semibold" : ""}
            >
              {lang.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
