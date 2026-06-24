function PageContainer({ children, className = "" }) {
  return (
    <main
      className={`mx-auto w-full max-w-7xl px-3 py-4 opacity-100 transition duration-300 ease-out sm:px-6 sm:py-8 lg:px-8 ${className}`}
    >
      {children}
    </main>
  );
}

export default PageContainer;
