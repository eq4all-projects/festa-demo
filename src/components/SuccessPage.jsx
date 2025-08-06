import { Link } from "react-router-dom";

const SuccessPage = () => {
  return (
    <div className="min-h-screen bg-green-100 flex flex-col justify-center items-center">
      <h1 className="text-5xl font-bold text-green-700 mb-8">정답입니다!</h1>
      <p className="text-2xl text-green-600 mb-12">다음 문제에 도전해보세요.</p>
      <Link to="/easy-mode">
        <button className="px-16 py-4 text-xl font-bold text-white bg-green-500 rounded-3xl shadow-lg hover:bg-green-600 transition-all duration-300">
          다음 문제
        </button>
      </Link>
    </div>
  );
};

export default SuccessPage;
