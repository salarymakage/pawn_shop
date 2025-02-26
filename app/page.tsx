export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-white">
      {/* Logo section */}
      <div className="w-full p-4 flex justify-center">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-48 w-auto object-contain" 
        />
      </div>

      {/* Content section */}
      <div className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Welcome
        </h1>
        
        <nav>
          <a 
            href="/signin" 
            className="text-blue-600 hover:text-blue-800 text-lg font-semibold"
          >
            Login
          </a>
        </nav>
      </div>
    </div>
  );
}