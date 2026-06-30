export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-muted sm:px-6">
        <p className="font-semibold text-foreground">Lumen</p>
        <p>A demo storefront built with Django REST Framework and Next.js.</p>
        <p>© {new Date().getFullYear()} Lumen. All rights reserved.</p>
      </div>
    </footer>
  );
}
