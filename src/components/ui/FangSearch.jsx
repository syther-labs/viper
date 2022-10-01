export default function FangSearch(props) {
  return (
    <div className="flex items-center justify-center w-full h-full absolute bg-[#00000044]">
      <div className="p-2 w-full h-full max-w-[600px] max-h-[600px]">
        <div className="flex items-center h-12 rounded-md border-1 border-z-7 bg-z-10 shadow-xl mb-3">
          <button>
            <img
              src="/assets/images/logos/viper-xs.webp"
              className="h-12 p-3"
            />
          </button>
          <input
            className="grow h-full bg-z-10 text-z-1 p-2 text-lg rounded-md"
            placeholder="Fang search..."
          />
        </div>
      </div>
    </div>
  );
}
