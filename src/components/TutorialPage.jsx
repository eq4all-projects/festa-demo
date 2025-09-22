// import { useNavigate } from "react-router-dom";
// import { useState, useEffect } from "react";
// import logo from "../assets/logo-white.png";
// import keycap from "../assets/tutorial/keycap.png";
// import arrow from "../assets/tutorial/arrow.png";
// import number from "../assets/tutorial/number.png";

// const TutorialPage = () => {
//   const navigate = useNavigate();
//   const [timeLeft, setTimeLeft] = useState(5);

//   // 애니메이션 상태 관리
//   const [showDescription, setShowDescription] = useState(false);
//   const [showKeyboard, setShowKeyboard] = useState(false);
//   const [showArrow, setShowArrow] = useState(false);

//   const [hideOldDescription, setHideOldDescription] = useState(false);
//   const [showNewDescription, setShowNewDescription] = useState(false);
//   const [hideImage, setHideImage] = useState(false);
//   const [showPhase2Keyboard, setShowPhase2Keyboard] = useState(false);
//   const [showPhase2Number, setShowPhase2Number] = useState(false);

//   // 타이머 프로그레스 바 설정
//   const radius = 42;
//   const circumference = 2 * Math.PI * radius;
//   const strokeDashoffset = circumference * (1 - timeLeft / 5);

//   // 타이머 관리 - 페이즈 2 number 이미지가 표시될 때 시작
//   useEffect(() => {
//     if (!showPhase2Number) return; // 페이즈 2 number 이미지가 표시되지 않으면 타이머 시작하지 않음

//     const timer = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           navigate("/ready");
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [navigate, showPhase2Number]);

//   // 단계별 애니메이션 타이밍 관리
//   useEffect(() => {
//     // 1초 후 설명 텍스트 보여주기
//     const descriptionTimer = setTimeout(() => {
//       setShowDescription(true);
//     }, 1500);

//     // 2초 후 키보드 이미지 보여주기
//     const keyboardTimer = setTimeout(() => {
//       setShowKeyboard(true);
//     }, 3500);

//     // 3초 후 number 이미지로 교체
//     const arrowTimer = setTimeout(() => {
//       setShowArrow(true);
//     }, 4500);

//     // 5초 후 페이즈 1 종료 (기존 설명 텍스트와 이미지 숨기기)
//     const hidePhase1Timer = setTimeout(() => {
//       setHideOldDescription(true);
//       setHideImage(true);
//     }, 7500);

//     // 5.5초 후 페이즈 2 텍스트 시작
//     const showPhase2TextTimer = setTimeout(() => {
//       setShowNewDescription(true);
//     }, 8500);

//     // 12초 후 페이즈 2 keycap 이미지 시작 (텍스트 표시 3.5초 후)
//     const showPhase2KeycapTimer = setTimeout(() => {
//       setShowPhase2Keyboard(true);
//     }, 10500);

//     // 14초 후 페이즈 2 number 이미지로 교체 (keycap 표시 2초 후)
//     const showPhase2NumberTimer = setTimeout(() => {
//       setShowPhase2Number(true);
//     }, 12000);

//     // 컴포넌트 언마운트 시 타이머 정리
//     return () => {
//       clearTimeout(descriptionTimer);
//       clearTimeout(keyboardTimer);
//       clearTimeout(arrowTimer);
//       clearTimeout(hidePhase1Timer);
//       clearTimeout(showPhase2TextTimer);
//       clearTimeout(showPhase2KeycapTimer);
//       clearTimeout(showPhase2NumberTimer);
//     };
//   }, []);

//   return (
//     <div className="min-h-screen bg-[#5A80CB] relative overflow-hidden">
//       {/* EQ4ALL 로고 */}
//       <div className="absolute top-8 right-8 z-10">
//         <img src={logo} alt="EQ4ALL" className="h-10 w-auto" />
//       </div>

//       {/* 메인 콘텐츠 */}
//       <div className="flex flex-col justify-center items-center min-h-screen px-6 md:px-12 lg:px-20 relative z-10">
//         {/* Tutorial 제목 */}
//         <div className="mb-10">
//           <div className="bg-brand-gray rounded-[50px] px-8 md:px-10 lg:px-12 py-3 md:py-4">
//             <span className="cursor-pointer px-18 py-4 text-3xl font-bold text-[#5A80CB] bg-[#F0F0F3] rounded-4xl">
//               챌린지, 이렇게 참여해요
//             </span>
//           </div>
//         </div>

//         {/* 설명 텍스트 - 동일한 위치에서 교체 */}
//         <div className="mb-12 text-brand-gray text-center max-w-4xl relative">
//           {/* 첫 번째 설명 텍스트 */}
//           <div
//             className={`absolute inset-0 transition-all duration-700 ease-out transform ${
//               showDescription && !hideOldDescription
//                 ? "opacity-100 translate-y-0 visible"
//                 : "opacity-0 translate-y-5 invisible"
//             }`}
//           >
//             <p className="text-2xl md:text-2xl lg:text-3xl text-[#F0F0F3] font-bold mb-2 tracking-tight">
//               방향키를 누르시면 아바타를 좌우로 회전하여 볼 수 있습니다
//             </p>
//             <p className="text-2xl md:text-2xl lg:text-3xl text-[#F0F0F3] font-bold tracking-tight">
//               단, 가운데 버튼을 누를 시 원위치로 돌아옵니다
//             </p>
//           </div>

//           {/* 두 번째 설명 텍스트 */}
//           <div
//             className={`absolute inset-0 transition-all duration-700 ease-out transform ${
//               showNewDescription
//                 ? "opacity-100 translate-y-0 visible"
//                 : "opacity-0 translate-y-5 invisible"
//             }`}
//           >
//             <p className="text-2xl md:text-2xl lg:text-3xl text-[#F0F0F3] font-base mb-2 tracking-tight">
//               각 선택지 앞에 번호가 부여되어 있습니다
//             </p>
//             <p className="text-2xl md:text-2xl lg:text-3xl text-[#F0F0F3] font-base tracking-tight">
//               제시되는 수어 영상을 보고 정답이라고 생각되는 선택지의 번호를
//               눌러주세요
//             </p>
//           </div>

//           {/* 높이 유지를 위한 투명한 placeholder */}
//           <div className="opacity-0">
//             <p className="text-2xl md:text-2xl lg:text-3xl text-[#F0F0F3] font-base mb-2 tracking-tight">
//               각 선택지 앞에 번호가 부여되어 있습니다
//             </p>
//             <p className="text-2xl md:text-2xl lg:text-3xl text-[#F0F0F3] font-base tracking-tight">
//               제시되는 수어 영상을 보고 정답이라고 생각되는 선택지의 번호를
//               눌러주세요
//             </p>
//           </div>
//         </div>

//         {/* 이미지 - 페이즈별 표시 */}
//         <div className="mt-20 mb-12">
//           <div className="h-48 md:h-56 lg:h-64 flex items-center justify-center">
//             {/* 페이즈 1 이미지 (keycap -> arrow) */}
//             {showKeyboard && !hideImage && (
//               <div className="mb-12 flex justify-center items-center transition-all duration-700 ease-out transform animate-fade-in-up">
//                 <img
//                   src={showArrow ? arrow : keycap}
//                   alt={showArrow ? "arrow keys" : "keycap"}
//                   className={`w-1/2 transition-all duration-500 ease-in-out`}
//                 />
//               </div>
//             )}

//             {/* 페이즈 2 이미지 (keycap -> number) */}
//             {showPhase2Keyboard && (
//               <div className="mb-12 flex justify-center items-center transition-all duration-700 ease-out transform animate-fade-in-up">
//                 <img
//                   src={showPhase2Number ? number : keycap}
//                   alt={showPhase2Number ? "number keys" : "keycap"}
//                   className={`w-1/2 transition-all duration-500 ease-in-out`}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* 타이머 */}
//         {showPhase2Number && (
//           <div className="absolute bottom-8 right-8">
//             <div className="relative w-20 h-20">
//               <svg className="w-full h-full" viewBox="0 0 100 100">
//                 {/* Background circle */}
//                 <circle
//                   className="text-[#81A4E9]"
//                   strokeWidth="15"
//                   stroke="currentColor"
//                   fill="transparent"
//                   r={radius}
//                   cx="50"
//                   cy="50"
//                 />
//                 {/* Progress circle */}
//                 <circle
//                   className="text-[#D9E1EF] transition-all duration-1000 ease-linear"
//                   strokeWidth="15"
//                   strokeDasharray={circumference}
//                   strokeDashoffset={strokeDashoffset}
//                   strokeLinecap="round"
//                   stroke="currentColor"
//                   fill="transparent"
//                   r={radius}
//                   cx="50"
//                   cy="50"
//                   transform="rotate(-90 50 50)"
//                 />
//               </svg>
//               {/* Timer number */}
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <span className="text-[#D9E1EF] text-4xl font-extrabold">
//                   {timeLeft}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TutorialPage;
