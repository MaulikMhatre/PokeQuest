
// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//     Heart, Zap, Award, BookOpen, ChevronRight, CheckCircle, XCircle, 
//     Loader2, User, Star, TrendingUp, Trophy, Egg, LayoutDashboard, Menu, X, MonitorPlay
// } from 'lucide-react';

// // --- Types for Data (Unchanged) ---
// interface Question {
//     id: number;
//     question: string;
//     options: string[];
//     answer: string;
//     topic: string;
//     selectedAnswer: string | null;
//     isCorrect: boolean | null;
// }

// interface QuizData {
//     quiz_title: string;
//     questions: Question[];
// }

// interface TrainerCardData {
//     user_id: string;
//     username: string;
//     level: number;
//     xp: number;
//     streak: number;
// }

// interface PokemonPanelData {
//     name: string;
//     xp_stat: string;
//     total_xp: number;
//     evolution_status: string;
//     image_url: string; 
// }

// interface DashboardData {
//     trainer_card: TrainerCardData;
//     pokemon_panel: PokemonPanelData;
//     achievements: { badges: number };
//     last_weak_topics: string[];
// }

// interface LeaderboardEntry {
//     username: string;
//     xp: number;
//     level: number;
//     pokemon_name: string;
// }

// // --- Mock Auth Context (Unchanged) ---
// const useAuth = () => {
//     const [token, setToken] = useState<string | null>(null);
//     const [userId, setUserId] = useState<string | null>(null);
//     const [isLoggedIn, setIsLoggedIn] = useState(false);

//     // NOTE: In a production environment, localStorage is generally replaced 
//     // by secure HTTP-only cookies and Firebase/Firestore for user data persistence.
//     useEffect(() => {
//         const storedToken = localStorage.getItem('auth_token');
//         const storedUserId = localStorage.getItem('user_id');
//         if (storedToken && storedUserId) {
//             setToken(storedToken);
//             setUserId(storedUserId);
//             setIsLoggedIn(true);
//         }
//     }, []);

//     const login = (authToken: string, uid: string) => {
//         localStorage.setItem('auth_token', authToken);
//         localStorage.setItem('user_id', uid);
//         setToken(authToken);
//         setUserId(uid);
//         setIsLoggedIn(true);
//     };

//     const logout = () => {
//         localStorage.removeItem('auth_token');
//         localStorage.removeItem('user_id');
//         setToken(null);
//         setUserId(null);
//         setIsLoggedIn(false);
//     };

//     return { token, userId, isLoggedIn, login, logout };
// };

// // --- Component: Quiz Question Renderer (Cute Theme Update) ---
// interface QuizQuestionProps {
//     question: Question;
//     questionIndex: number;
//     totalQuestions: number;
//     handleOptionSelect: (option: string) => void;
//     isSubmissionReview: boolean;
// }

// const QuizQuestion: React.FC<QuizQuestionProps> = ({
//     question,
//     questionIndex,
//     totalQuestions,
//     handleOptionSelect,
//     isSubmissionReview,
// }) => {
//     const { question: text, options, selectedAnswer, answer, topic } = question;

//     const getOptionClasses = (option: string) => {
//         let classes = 'p-4 my-3 rounded-2xl transition-all duration-300 border-2 text-lg font-semibold ';

//         if (isSubmissionReview) {
//             if (option === answer) {
//                 classes += 'bg-green-100 border-green-500 text-green-800 shadow-lg';
//             } else if (option === selectedAnswer && option !== answer) {
//                 classes += 'bg-red-100 border-red-500 text-red-800 shadow-lg';
//             } else {
//                 classes += 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100';
//             }
//         } else {
//             classes += 'cursor-pointer hover:bg-yellow-50 hover:shadow-md';
//             if (option === selectedAnswer) {
//                 classes += 'bg-red-500 border-red-700 shadow-xl shadow-red-300/50 text-white';
//             } else {
//                 classes += 'bg-white border-gray-300 text-gray-800';
//             }
//         }
//         return classes;
//     };

//     return (
//         <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-red-300/40 w-full mx-auto transform transition-all duration-300 border-4 border-red-500">
//             <div className="text-sm font-black text-red-500 mb-2 tracking-widest">
//                 QUESTION {questionIndex + 1} / {totalQuestions}
//             </div>
//             <h3 className="text-2xl font-black text-gray-900 mb-4">{text}</h3>
//             <p className="text-xs text-gray-500 mb-6 italic border-b border-gray-300 pb-2">Topic: {topic}</p>

//             {options.map((option, index) => (
//                 <div
//                     key={index}
//                     className={getOptionClasses(option)}
//                     onClick={!isSubmissionReview ? () => handleOptionSelect(option) : undefined}
//                 >
//                     {option}
//                     {isSubmissionReview && option === answer && (
//                         <CheckCircle className="inline w-5 h-5 ml-2 text-green-600" />
//                     )}
//                     {isSubmissionReview && option === selectedAnswer && option !== answer && (
//                         <XCircle className="inline w-5 h-5 ml-2 text-red-600" />
//                     )}
//                 </div>
//             ))}

//             {isSubmissionReview && selectedAnswer && (
//                 <p className={`mt-6 p-3 rounded-xl text-sm font-black ${question.isCorrect ? 'bg-green-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md'}`}>
//                     {question.isCorrect ? 'Awesome! Correct answer!' : `Oops! The correct answer was: "${answer}".`}
//                 </p>
//             )}
//         </div>
//     );
// };


// // --- Component: Quiz Battle (Page 3 - Active Quiz) ---
// interface QuizBattleProps {
//     subject: string;
//     onQuizComplete: (data: { score: number; weak_topics: string[] }) => void;
//     onExit: () => void;
// }

// const QuizBattle: React.FC<QuizBattleProps> = ({ subject, onQuizComplete, onExit }) => {
//     const { token } = useAuth();
//     const [quiz, setQuiz] = useState<QuizData | null>(null);
//     const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
    
//     const [isReviewing, setIsReviewing] = useState(false); 
//     const [submissionResult, setSubmissionResult] = useState<any>(null);
    
//     const [timeLeft, setTimeLeft] = useState(60); 

//     useEffect(() => {
//         if (quiz && !isReviewing) {
//             setTimeLeft(60);
//         }
//     }, [currentQuestionIndex, quiz, isReviewing]);

//     useEffect(() => {
//         if (loading || isReviewing) return; 

//         if (timeLeft <= 0) {
//             handleTimeExpired();
//             return;
//         }

//         const timerId = setTimeout(() => {
//             setTimeLeft(prevTime => prevTime - 1);
//         }, 1000);

//         return () => clearTimeout(timerId); 
//     }, [timeLeft, currentQuestionIndex, loading, isReviewing]);

//     const handleTimeExpired = () => {
//         if (!quiz) return;
        
//         setQuiz(prevQuiz => {
//             if (!prevQuiz) return null;

//             const updatedQuestions = prevQuiz.questions.map((q, index) => {
//                 if (index === currentQuestionIndex && q.selectedAnswer === null) {
//                     return { ...q, selectedAnswer: "Time Expired / No Answer", isCorrect: false }; 
//                 }
//                 return q;
//             });

//             return { ...prevQuiz, questions: updatedQuestions };
//         });

//         handleNext(true); 
//     };

//     const fetchQuiz = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         if (!token) {
//             setError("Authentication token missing. Please log in again.");
//             setLoading(false);
//             return;
//         }

//         try {
//             // Using exponential backoff for API calls
//             const maxRetries = 3;
//             let response = null;
//             let data = null;
            
//             for (let i = 0; i < maxRetries; i++) {
//                 try {
//                     response = await fetch('http://127.0.0.1:5000/api/generate_quiz', {
//                         method: 'POST',
//                         headers: {
//                             'Content-Type': 'application/json',
//                             'Authorization': `Bearer ${token}`,
//                         },
//                         body: JSON.stringify({ subject }),
//                     });
                    
//                     data = await response.json();
                    
//                     if (response.ok && !data.error) {
//                         break; 
//                     } else if (i === maxRetries - 1) {
//                          throw new Error(data.error || 'Failed to generate quiz after multiple retries.');
//                     }
//                 } catch (e) {
//                     if (i === maxRetries - 1) {
//                         throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
//                     }
//                     await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
//                 }
//             }


//             const initializedQuestions: Question[] = data.questions.map((q: any, index: number) => ({
//                 ...q,
//                 id: index, 
//                 selectedAnswer: null,
//                 isCorrect: null,
//             }));

//             setQuiz({ ...data, questions: initializedQuestions });
//             setTimeLeft(60); 
//         } catch (err: any) {
//             console.error("Quiz Fetch Error:", err);
//             setError(err.message || "An unknown error occurred while fetching the quiz.");
//         } finally {
//             setLoading(false);
//         }
//     }, [subject, token]);

//     useEffect(() => {
//         fetchQuiz();
//     }, [fetchQuiz]);

//     const handleOptionSelect = (option: string) => {
//         if (isReviewing) return;

//         setQuiz(prevQuiz => {
//             if (!prevQuiz) return null;

//             const updatedQuestions = prevQuiz.questions.map((q, index) => {
//                 if (index === currentQuestionIndex) {
//                     const isCorrect = option === q.answer;
//                     return { ...q, selectedAnswer: option, isCorrect }; 
//                 }
//                 return q;
//             });

//             return { ...prevQuiz, questions: updatedQuestions };
//         });
//     };

//     const handleNext = (forceSubmit = false) => {
//         if (!forceSubmit && (!quiz || !quiz.questions[currentQuestionIndex].selectedAnswer)) {
//             console.log("Please select an option before moving to the next question!");
//             return;
//         }

//         setTimeLeft(60); 

//         if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
//             setCurrentQuestionIndex(prev => prev + 1);
//         } else {
//             handleSubmit();
//         }
//     };

//     const handleSubmit = () => {
//         if (!quiz) return;

//         let score = 0;
//         const topicIncorrectCounts: Record<string, number> = {};

//         quiz.questions.forEach(q => {
//             if (q.isCorrect) {
//                 score++;
//             } else {
//                 if (q.topic) {
//                     topicIncorrectCounts[q.topic] = (topicIncorrectCounts[q.topic] || 0) + 1;
//                 }
//             }
//         });

//         // Filter for topics where at least one question was answered incorrectly
//         const finalWeakTopics = Object.keys(topicIncorrectCounts).filter(topic => topicIncorrectCounts[topic] > 0);


//         setLoading(true);
        
//         // --- Submission API Call with Backoff ---
//         const submitQuiz = async () => {
//              const maxRetries = 3;
//             let response = null;
//             let data = null;
            
//             for (let i = 0; i < maxRetries; i++) {
//                 try {
//                     response = await fetch('http://127.0.0.1:5000/api/submit_quiz', {
//                         method: 'POST',
//                         headers: {
//                             'Content-Type': 'application/json',
//                             'Authorization': `Bearer ${token}`,
//                         },
//                         body: JSON.stringify({
//                             subject,
//                             score,
//                             total_questions: quiz.questions.length,
//                             new_weak_topics: finalWeakTopics,
//                         }),
//                     });

//                     data = await response.json();
                    
//                     if (response.ok && !data.error) {
//                         return data;
//                     } else if (i === maxRetries - 1) {
//                          throw new Error(data.error || 'Failed to submit quiz after multiple retries.');
//                     }
//                 } catch (e) {
//                      if (i === maxRetries - 1) {
//                         throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
//                     }
//                     await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
//                 }
//             }
//         }
        
//         submitQuiz()
//         .then(data => {
//             setLoading(false);
            
//             setIsReviewing(true); 
//             setSubmissionResult(data); 
//             setCurrentQuestionIndex(0); 
//         })
//         .catch(err => {
//             console.error("Submission Error:", err);
//             setError(err.message || "Failed to submit results.");
//             setLoading(false);
//         });
        
//     };
    
//     const handleReviewComplete = () => {
//         if (submissionResult) {
//             onQuizComplete(submissionResult);
//         } else {
//             onExit(); // Fallback
//         }
//     };

//     if (loading) {
//         return (
//             <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl shadow-2xl h-96 w-full max-w-2xl mx-auto border-4 border-red-500">
//                 <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
//                 <p className="text-gray-900 font-black text-xl">Generating Personalized Quiz on {subject}...</p>
//                 <p className="text-sm text-gray-500 mt-1">Please wait for the AI battle to commence!</p>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="p-10 bg-red-100 border border-red-500 rounded-xl shadow-2xl w-full max-w-2xl mx-auto text-red-800">
//                 <h3 className="text-xl font-bold text-red-600 mb-3">Quiz Error</h3>
//                 <p className="text-red-500">{error}</p>
//                 <button
//                     onClick={onExit}
//                     className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
//                 >
//                     Go Back
//                 </button>
//             </div>
//         );
//     }

//     if (!quiz) {
//         return (
//             <div className="p-10 bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto text-gray-900">
//                 <p className="text-lg font-semibold text-gray-500">Quiz data is unavailable.</p>
//                 <button
//                     onClick={onExit}
//                     className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
//                 >
//                     Return
//                 </button>
//             </div>
//         );
//     }

//     const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
//     const currentQuestion = quiz.questions[currentQuestionIndex];
//     const nextButtonText = isLastQuestion ? 'Submit Quiz' : 'Next Question';
//     const nextButtonDisabled = !currentQuestion.selectedAnswer && !isReviewing;

//     const timerClasses = `text-3xl font-black ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`;

//     return (
//         <div className="w-full max-w-2xl mx-auto">
//             <h2 className="text-4xl font-black text-gray-900 mb-8 text-center border-b-4 border-red-500/50 pb-3">
//                 {isReviewing ? 'Quiz Review' : quiz.quiz_title}
//             </h2>
            
//             {!isReviewing && (
//                 <div className="text-center mb-8">
//                     <div className="p-4 bg-yellow-400 rounded-full shadow-xl inline-block border-4 border-white animate-bounce-slow">
//                         <span className="text-xs text-black block mb-1 font-extrabold tracking-widest">TIME</span>
//                         <span className={timerClasses}>{timeLeft}s</span>
//                     </div>
//                 </div>
//             )}
            
//             {/* Quiz Question */}
//             <QuizQuestion
//                 question={currentQuestion}
//                 questionIndex={currentQuestionIndex}
//                 totalQuestions={quiz.questions.length}
//                 handleOptionSelect={handleOptionSelect}
//                 isSubmissionReview={isReviewing}
//             />

//             {/* Navigation Buttons */}
//             <div className={`mt-10 flex ${isReviewing ? 'justify-between' : 'justify-end'} space-x-6 w-full max-w-lg mx-auto`}>
//                 {isReviewing && (
//                     <button
//                         onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
//                         disabled={currentQuestionIndex === 0}
//                         className="px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-xl shadow-lg hover:bg-gray-400 transition disabled:opacity-50 transform hover:scale-[1.05]"
//                     >
//                         <ChevronRight className="inline w-5 h-5 mr-1 transform rotate-180" /> Back
//                     </button>
//                 )}
                
//                 {isReviewing ? (
//                     <button
//                         onClick={handleReviewComplete} 
//                         className="px-8 py-4 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-400/50 hover:bg-green-600 transition transform hover:scale-[1.05]"
//                     >
//                         Finished Reviewing
//                     </button>
//                 ) : (
//                     <button
//                         onClick={() => handleNext(false)} 
//                         disabled={nextButtonDisabled}
//                         className={`px-10 py-4 font-black text-xl rounded-2xl transition duration-300 transform shadow-2xl
//                             ${nextButtonDisabled
//                                 ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
//                                 : 'bg-red-500 text-white hover:bg-red-600 hover:scale-[1.03] ring-4 ring-yellow-400/50'
//                             }
//                         `}
//                     >
//                         {nextButtonText} <ChevronRight className="inline w-6 h-6 ml-1" />
//                     </button>
//                 )}
//             </div>
            
//             {isReviewing && (
//                 <div className="mt-8 p-4 bg-yellow-50 border-4 border-yellow-400 rounded-xl w-full max-w-lg mx-auto shadow-inner">
//                     <p className="text-center font-black text-2xl text-red-600">
//                         Final Score: {quiz.questions.filter(q => q.isCorrect).length} / {quiz.questions.length}
//                     </p>
//                 </div>
//             )}
//         </div>
//     );
// };


// // --- Helper StatCard (Pokedex Style) ---
// const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
//     <div className="flex items-center p-4 bg-white/80 rounded-xl shadow-md border border-gray-200 transform hover:scale-[1.03] transition duration-200 backdrop-blur-sm">
//         <div className={`p-3 ${color} rounded-full mr-4 shadow-lg ring-2 ring-white/50`}>
//             {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 text-white' })}
//         </div>
//         <div>
//             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
//             <p className="text-2xl font-black text-gray-900">{value}</p>
//         </div>
//     </div>
// );


// // --- Component: Dashboard (Page 1 Content - POKEDEV THEME) ---
// const Dashboard: React.FC<{ 
//     onStartQuiz: (subject: string) => void; // Kept only for API integration
//     dashboardData: DashboardData | null; 
//     onViewLeaderboard: () => void 
// }> = ({ dashboardData, onViewLeaderboard }) => {
//     // Subjects removed from Dashboard
//     const weakTopics = dashboardData?.last_weak_topics || [];
//     const trainer = dashboardData?.trainer_card;
//     const pokemon = dashboardData?.pokemon_panel;
    
//     const xp_parts = pokemon?.xp_stat.split('/');
//     const current_xp_mod = parseInt(xp_parts?.[0] || '0');
//     const required_xp_mod = parseInt(xp_parts?.[1] || '300');
//     const xp_percent = required_xp_mod > 0 ? Math.min(100, (current_xp_mod / required_xp_mod) * 100) : 0;

//     const pokemonImageUrl = pokemon?.image_url || `https://placehold.co/128x128/999999/white?text=${pokemon?.name || 'Partner'}`;
//     const placeholderColors = {
//         Pikachu: 'bg-yellow-400',
//         Charmander: 'bg-orange-500',
//         Bulbasaur: 'bg-green-500',
//         Squirtle: 'bg-blue-500',
//         default: 'bg-gray-400'
//     };
//     const pokemonColorClass = placeholderColors[pokemon?.name as keyof typeof placeholderColors] || placeholderColors.default;

//     return (
//         <div className="p-6 md:p-10 bg-white/95 rounded-3xl shadow-[0_0_80px_rgba(37,99,235,0.4)] w-full max-w-5xl mx-auto border-4 border-blue-500/50 backdrop-blur-sm">
            
//             <h1 className="text-4xl font-black text-gray-900 mb-8 flex items-center border-b-2 border-red-500 pb-3">
//                 <LayoutDashboard className="w-8 h-8 mr-3 text-blue-600" />
//                 Trainer Command Center
//             </h1>
            
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
//                 {/* Trainer Card & Stats (Pokedex Data Screen) */}
//                 <div className="lg:col-span-2 p-8 bg-blue-50 rounded-2xl shadow-inner border-2 border-blue-200">
//                     <h2 className="text-3xl font-black text-blue-600 mb-6 flex items-center">
//                         <MonitorPlay className="w-7 h-7 mr-3 text-red-600 animate-pulse" />
//                         Trainer Data Log
//                     </h2>
//                     {trainer ? (
//                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
//                             <StatCard icon={<User />} label="Username" value={trainer.username} color="bg-blue-500" />
//                             <StatCard icon={<Star />} label="Level" value={trainer.level} color="bg-yellow-500" />
//                             <StatCard icon={<Zap />} label="Total XP" value={trainer.xp} color="bg-red-500" />
//                             <StatCard icon={<TrendingUp />} label="Streak" value={trainer.streak} color="bg-green-500" />
//                             <StatCard icon={<Award />} label="Badges" value={dashboardData?.achievements.badges || 0} color="bg-purple-500" />
//                             <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
//                                 <button
//                                     onClick={onViewLeaderboard}
//                                     className="flex items-center w-full justify-center px-4 py-3 bg-red-500 text-white font-black rounded-xl shadow-lg 
//                                              hover:bg-red-600 transition duration-300 transform hover:scale-[1.02] ring-2 ring-yellow-400/50"
//                                 >
//                                     <Trophy className="w-5 h-5 mr-2 text-white" /> Global Rankings
//                                 </button>
//                             </div>
//                         </div>
//                     ) : (
//                         <p className="text-gray-500">Loading trainer data...</p>
//                     )}
//                 </div>

//                 {/* Pokémon Panel - Status Screen */}
//                 <div className={`lg:col-span-1 p-8 ${pokemonColorClass} border-4 border-red-500 rounded-3xl shadow-2xl shadow-red-500/50 flex flex-col items-center text-center text-white relative overflow-hidden transform hover:scale-[1.03] transition duration-500`}>
                    
//                     <div className="absolute inset-0 bg-black/20"></div> 

//                     <h2 className="relative z-10 text-3xl font-black text-white mb-4 tracking-wider drop-shadow-lg">
//                         PARTNER
//                     </h2>
//                     <p className="relative z-10 text-xl font-extrabold text-white mb-4 drop-shadow-md">
//                         {pokemon?.name || '...'}
//                     </p>
                    
//                     <div className="relative z-10 w-36 h-36 mb-4 border-6 border-white rounded-full overflow-hidden flex items-center justify-center bg-white transform scale-100 animate-pulse-slow">
//                         <img 
//                             src={pokemonImageUrl} 
//                             alt={`${pokemon?.name} evolution stage`} 
//                             className="w-full h-full object-cover transform scale-[1.2]" 
//                             onError={(e) => { e.currentTarget.src = `https://placehold.co/128x128/${pokemonColorClass.replace('bg-','')}/white?text=${pokemon?.name || 'Partner'}`; }} 
//                         />
//                     </div>
                    
//                     <p className="relative z-10 text-base font-black text-yellow-300 mb-4 drop-shadow-lg">{pokemon?.evolution_status || 'Checking Status...'}</p>

//                     <div className="relative z-10 w-full mt-4 bg-black/30 p-4 rounded-xl shadow-inner border border-white/50">
//                         <p className="text-xs font-black text-white mb-1 flex justify-between">
//                             <span>XP PROGRESS (NEXT LEVEL)</span>
//                             <span>{pokemon?.xp_stat || '0/300'}</span>
//                         </p>
//                         <div className="w-full bg-gray-300 rounded-full h-4 shadow-md">
//                             <div 
//                                 className="h-4 bg-yellow-400 rounded-full transition-all duration-700 ease-out shadow-lg shadow-yellow-300/50"
//                                 style={{ width: `${xp_percent}%` }}
//                             ></div>
//                         </div>
//                     </div>
//                 </div>

//             </div>
            
//             {/* Weakness Report */}
//             <div className="p-6 border-l-8 border-yellow-400 bg-red-100/70 rounded-r-2xl shadow-lg">
//                 <h3 className="text-2xl font-black text-red-800 mb-2 flex items-center">
//                     <Zap className="w-6 h-6 mr-3 text-yellow-500 fill-yellow-500" /> Current Training Focus
//                 </h3>
//                 {weakTopics.length > 0 ? (
//                     <p className="text-base text-gray-900 font-medium">
//                         Your next battle should target: <span className="text-red-500 font-extrabold">{weakTopics.join(', ')}</span>. Use the "Start Quiz Battle" tab to begin!
//                     </p>
//                 ) : (
//                     <p className="text-base text-gray-900">No recent weakness data! Excellent work, Trainer! Try a fresh subject in the Quiz Battle tab!</p>
//                 )}
//             </div>
//         </div>
//     );
// };


// // --- Component: Quiz Subject Selection (Page 3 Content - POKEBALLS) ---
// interface QuizSubjectSelectionProps {
//     onStartQuiz: (subject: string) => void;
//     dashboardData: DashboardData | null;
// }
// const QuizSubjectSelectionScreen: React.FC<QuizSubjectSelectionProps> = ({ onStartQuiz, dashboardData }) => {
//     const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
//     const weakTopics = dashboardData?.last_weak_topics || [];

//     const getSubjectColor = (subject: string) => {
//         if (weakTopics.includes(subject)) return 'bg-red-500 ring-red-300';
//         return 'bg-blue-500 ring-blue-300';
//     };

//     return (
//         <div className="p-6 md:p-10 bg-white/95 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.4)] w-full max-w-5xl mx-auto border-4 border-yellow-400 backdrop-blur-sm">
//             <h2 className="text-4xl font-black text-gray-900 mb-4 flex items-center border-b-2 border-yellow-400 pb-3">
//                 <Zap className="w-8 h-8 mr-3 text-red-500 fill-red-500" />
//                 Select Your Battle Subject
//             </h2>
            
//             <p className="text-gray-600 mb-10 font-medium text-lg">Choose a field of study to generate a personalized quiz and level up your partner Pokémon!</p>

//             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
//                 {subjects.map(subject => {
//                     const isWeak = weakTopics.includes(subject);
//                     const colorClass = isWeak ? 'bg-red-600' : 'bg-blue-600';
//                     const ringClass = isWeak ? 'ring-red-400' : 'ring-blue-400';
//                     const hoverClass = isWeak ? 'hover:bg-red-700' : 'hover:bg-blue-700';

//                     return (
//                         <button
//                             key={subject}
//                             onClick={() => onStartQuiz(subject)}
//                             className={`flex flex-col items-center justify-center p-6 ${colorClass} text-white font-black rounded-full aspect-square 
//                                          shadow-xl shadow-gray-400/50 ${hoverClass} transition duration-300 transform hover:scale-[1.10] text-center text-xl 
//                                          ring-8 ${ringClass} border-4 border-white relative overflow-hidden`}
//                         >
//                             {/* Inner Circle / Button Divider */}
//                             <div className="absolute w-full h-1/4 bg-white/30 top-1/2 -translate-y-1/2"></div>
                            
//                             {/* Pokeball Button Effect (Circle) */}
//                             <div className="absolute w-6 h-6 bg-white rounded-full border-2 border-gray-900/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                            
//                             <span className="relative z-10 text-3xl mb-1 mt-2 text-yellow-300 drop-shadow-md">{subject[0]}</span>
//                             <span className="relative z-10 text-lg font-bold">{subject}</span>
                            
//                             {isWeak && (
//                                 <div className="absolute top-2 right-2 p-1 bg-yellow-400 rounded-full">
//                                     <Zap className="w-4 h-4 text-red-600" />
//                                 </div>
//                             )}
//                         </button>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };


// // --- Leaderboard Screen (Page 2) ---
// const LeaderboardScreen: React.FC = () => {
//     const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     const fetchLeaderboard = useCallback(async () => {
//         setLoading(true);
//         setError(null);
        
//         try {
//             const maxRetries = 3;
//             let response = null;
//             let data = null;
            
//             for (let i = 0; i < maxRetries; i++) {
//                 try {
//                     response = await fetch('http://127.0.0.1:5000/api/leaderboard'); 
//                     data = await response.json();
                    
//                     if (response.ok) {
//                         break; 
//                     } else if (i === maxRetries - 1) {
//                          throw new Error(data.error || 'Failed to fetch leaderboard data after multiple retries.');
//                     }
//                 } catch (e) {
//                      if (i === maxRetries - 1) {
//                         throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
//                     }
//                     await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
//                 }
//             }
            
//             setLeaderboard(data || []); 

//         } catch (err: any) {
//             console.error("Leaderboard Fetch Error:", err);
//             setError(err.message || "An unknown error occurred while fetching the leaderboard.");
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         fetchLeaderboard();
//     }, [fetchLeaderboard]);

//     if (loading) {
//         return (
//              <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl shadow-2xl h-96 w-full max-w-4xl mx-auto border-4 border-red-500">
//                 <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
//                 <p className="text-gray-900 font-black text-xl">Fetching Top Trainers...</p>
//              </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="p-10 bg-red-100 border border-red-500 rounded-xl shadow-2xl w-full max-w-4xl mx-auto text-red-800">
//                 <h3 className="text-xl font-bold text-red-600 mb-3">Leaderboard Error</h3>
//                 <p className="text-red-500">{error}</p>
//             </div>
//         );
//     }
    
//     const getMedal = (rank: number) => {
//         if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-lg animate-pulse" />;
//         if (rank === 2) return <Trophy className="w-7 h-7 text-gray-400 fill-gray-400 drop-shadow-lg" />;
//         if (rank === 3) return <Trophy className="w-6 h-6 text-amber-600 fill-amber-600 drop-shadow-lg" />;
//         return <span className="w-6 h-6 text-gray-500 font-black text-lg">{rank}</span>;
//     };


//     return (
//         <div className="w-full max-w-4xl mx-auto p-8 bg-white/95 rounded-3xl shadow-[0_0_80px_rgba(255,0,0,0.4)] border-4 border-red-500 backdrop-blur-sm">
//             <h2 className="text-4xl font-black text-red-600 mb-8 flex items-center justify-center border-b-4 border-yellow-400 pb-4">
//                 <Trophy className="w-9 h-9 mr-4 text-yellow-400 fill-yellow-400 drop-shadow-xl" />
//                 Global Champion Ranking
//             </h2>

//             <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-xl">
//                 <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-blue-600 text-white sticky top-0">
//                         <tr>
//                             <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider rounded-tl-xl">Rank</th>
//                             <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Trainer</th>
//                             <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Level</th>
//                             <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Total XP</th>
//                             <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider rounded-tr-xl">Partner</th>
//                         </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-100 text-gray-900">
//                         {leaderboard.length === 0 ? (
//                             <tr>
//                                 <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 text-center">
//                                     No trainers found on the leaderboard. Be the first!
//                                 </td>
//                             </tr>
//                         ) : (
//                             leaderboard.map((entry, index) => (
//                                 <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 hover:bg-yellow-50 transition' : 'bg-white hover:bg-yellow-50 transition'}>
//                                     <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-gray-900 flex items-center space-x-2">
//                                         {getMedal(index + 1)}
//                                     </td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-500">{entry.username}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{entry.level}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-600 font-black">{entry.xp.toLocaleString()}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{entry.pokemon_name}</td>
                                
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };


// // --- Component: Login Screen (Pre-Authentication - UNCHANGED) ---
// const LoginScreen: React.FC<{ onLoginSuccess: (token: string, userId: string) => void }> = ({ onLoginSuccess }) => {
//     const [username, setUsername] = useState('');
//     const [password, setPassword] = useState('');
//     const [pokemonName, setPokemonName] = useState('Pikachu');
//     const [isRegisterMode, setIsRegisterMode] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');

//     const handleSubmit = async () => {
//         setLoading(true);
//         setError('');
//         setSuccessMessage('');
//         const endpoint = isRegisterMode ? 'register' : 'login';
        
//         try {
//             const body = isRegisterMode 
//                 ? { username, password, pokemon_name: pokemonName } 
//                 : { username, password };
            
//             const maxRetries = 3;
//             let response = null;
//             let data = null;

//             for (let i = 0; i < maxRetries; i++) {
//                 try {
//                     response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, {
//                         method: 'POST',
//                         headers: { 'Content-Type': 'application/json' },
//                         body: JSON.stringify(body),
//                     });
//                     data = await response.json();

//                     if (response.ok && !data.error) {
//                         break;
//                     } else if (i === maxRetries - 1) {
//                         throw new Error(data.error || `${endpoint} failed after multiple retries.`);
//                     }
//                 } catch (e) {
//                      if (i === maxRetries - 1) {
//                         throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
//                     }
//                     await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
//                 }
//             }


//             if (isRegisterMode) {
//                 setSuccessMessage("Registration successful! Please log in.");
//                 setIsRegisterMode(false);
//             } else {
//                 onLoginSuccess(data.auth_token, data.user_id);
//             }
//         } catch (err: any) {
//             setError(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//                  <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-cover bg-center p-4" style={{ backgroundImage: "url('/images/bg_login.jpeg')" }}>
//                 {/* Pikachu */}
//                 <img
//                 src="/images/pikachu .png"
//                 alt="Pikachu"
//                 className="absolute w-64 h-64 sm:w-80 sm:h-78 left-[23%] top-[47%] transform -translate-y-1/2 z-0 opacity-100 mix-blend-normal"
//                 />

//                 {/* Bulbasaur */}
//                 <img
//                 src="/images/bulbasaur.png"
//                 alt="Bulbasaur"
//                 className="absolute w-48 h-48 sm:w-80 sm:h-75 top-[2%] left-[37%] transform -translate-x-1/2 z-0 opacity-100 mix-blend-normal"
//                 />

//                 {/* Charmander */}
//                 <img
//                 src="/images/charmandar.png"
//                 alt="Charmander"
//                 className="absolute w-56 h-56 sm:w-80 sm:h-75 top-[30%] right-[27%] transform -translate-y-1/2 z-0 opacity-100 mix-blend-normal"
//                 />

//                 {/* Squirtle */}
//                 <img
//                 src="/images/squirtle.png"
//                 alt="Squirtle"
//                 className="absolute w-56 h-56 sm:w-88 sm:h-90 bottom-[25%] right-[20%] transform z-0 opacity-100 mix-blend-normal"
//                 />

            

//             <div className="w-full max-w-sm p-8 rounded-2xl relative z-10
//              bg-black/40 backdrop-blur-xl
//              border border-[#00FFD1]/10
//              shadow-[0_0_30px_rgba(0,255,209,0.4)]
//              ring-2 ring-[#00FFD1]/40
//              flex flex-col items-center">
//         <h2 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
//             Trainer {isRegisterMode ? 'Registration' : 'Login'}
//         </h2>

//         {successMessage && (
//             <div className="p-3 mb-4 bg-green-600/80 text-white rounded-lg font-medium w-full text-center">
//             {successMessage}
//             </div>
//         )}

       
//                 <div className="mb-5">
//                     <label htmlFor="username-input" className="block text-lg font-semibold text-gray-400 mb-1">
//                         Username
//                     </label>
//                     <input
//                         id="username-input"
//                         type="text"
//                         placeholder="Username"
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                         className="h-14 w-full text-base px-5 pr-12
//                                 border-none rounded-xl
//                                 focus:ring-2 focus:ring-[#00FFD1]
//                                 bg-[#151C20] text-white placeholder-gray-500
//                                 shadow-inner shadow-gray-700/50 transition-colors"
//                     />
//                 </div>

//                 {/* Password */}
//                 <div className="mb-6">
//                     <label htmlFor="password-input" className="block text-lg font-semibold text-gray-400 mb-1">
//                         Password
//                     </label>
//                     <input
//                         id="password-input"
//                         type="password"
//                         placeholder="Password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         className="h-14 w-full text-base px-5 pr-12
//                                 border-none rounded-xl
//                                 focus:ring-2 focus:ring-[#00FFD1]
//                                 bg-[#151C20] text-white placeholder-gray-500
//                                 shadow-inner shadow-gray-700/50 transition-colors"
//                     />
//                 </div>

//         {/* Pokémon dropdown (only for register mode) */}
//         {isRegisterMode && (
//             <select
//             value={pokemonName}
//             onChange={(e) => setPokemonName(e.target.value)}
//             className="w-full p-3 mb-6 border border-gray-500 bg-black/60 text-white rounded-lg
//                         focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
//             >
//             <option value="Pikachu">Pikachu</option>
//             <option value="Charmander">Charmander</option>
//             <option value="Bulbasaur">Bulbasaur</option>
//             <option value="Squirtle">Squirtle</option>
//             <option value="Turtwig">Turtwig</option>
//             </select>
//         )}

//         {error && (
//             <div className="p-3 mb-4 bg-red-700/80 text-white rounded-lg font-medium w-full text-center">
//             {error}
//             </div>
//         )}

//         {/* Login/Register Button */}
//         <button
//             onClick={handleSubmit}
//             disabled={loading || !username || !password || (isRegisterMode && !pokemonName)}
//             className="w-full py-3 mt-2 font-extrabold rounded-lg shadow-lg transition-all duration-300
//                     bg-gradient-to-t from-orange-500 to-yellow-400
//                     hover:from-orange-600 hover:to-yellow-300
//                     text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
//         >
//             {loading ? (
//             <Loader2 className="w-5 h-5 inline animate-spin text-black" />
//             ) : (
//             isRegisterMode ? 'Register' : 'Login'
//             )}
//         </button>

//         {/* Switch mode link */}
//         <p className="mt-6 text-center text-sm text-gray-300">
//             {isRegisterMode ? 'Already have an account?' : "Don’t have an account?"}
//             <button
//             onClick={() => {
//                 setIsRegisterMode(!isRegisterMode);
//                 setError('');
//                 setSuccessMessage('');
//             }}
//             className="text-red-400 hover:text-red-300 font-semibold ml-2 transition"
//             >
//             {isRegisterMode ? 'Login here' : 'Register here'}
//             </button>
//         </p>
//         </div>
//     </div>


                

//     );
// };


// // --- Component: Landing Screen (Pre-Authentication - UNCHANGED) ---
// const LandingScreen: React.FC<{ onStartJourney: () => void }> = ({ onStartJourney }) => {
    
// const WelcomeScreen: React.FC<{ onGoToLogin: () => void }> = ({ onGoToLogin }) => {
//     const pokemonName = "Pikachu";
//     return (

//             <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 relative">
//             {/* Dark Overlay for contrast */}
//             <div className="absolute inset-0 bg-black/70"></div>
            
//             {/* MODIFIED: Adjusted max-w and gap for larger image */}
//             <div className="z-10 max-w-7xl w-full flex flex-col md:flex-row items-center justify-between lg:gap-16">
                
//                 {/* Left: Text and Buttons */}
//                 <div className="text-left space-y-6 md:w-1/2 p-4">
//                     <h1 className="text-6xl font-extrabold leading-tight">
//                         Begin Your Adventure!
//                     </h1>
//                     <p className="text-xl text-gray-300">
//                         Immerse yourself in the captivating world of Pokémon. Choose your starter, witness its hatch, and embark on a personalized learning experience that will elevate your knowledge and skills. Unlock the secrets of these beloved creatures
//                     </p>

//                     <div className="pt-6 space-y-4">
//                         {/* 🛑 Single "Let's Begin" Button linked to Login (onGoToLogin) 🛑 */}
//                         <button
//                             onClick={onGoToLogin} 
//                             className="flex items-center justify-center px-10 py-4 w-64 bg-[#FFEA00] text-black font-extrabold text-lg rounded-xl shadow-xl shadow-yellow-500/50
//                                        transition duration-200 transform hover:scale-[1.03] ring-2 ring-[#FFEA00]"
//                         >
//                             <Zap className="w-5 h-5 mr-2" /> Let's Begin!
//                         </button>
//                     </div>
//                 </div>

//                 {/* Right: 3D Aesthetic Image Placeholder */}
//                 {/* 🛑 MODIFIED: Adjusted width classes for the image and its container 🛑 */}
//                 <div className="md:w-1/2 flex justify-center p-4 overflow-visible relative">
//                     <img 
//                         src='/images/pikachu_landing_03.png'
//                         alt="3D Pokémon Starter Scene"
//                         // 🛑 NEW CLASSES: Made image take up more width and shifted it right 🛑
//                         className="w-[180%] max-w-none md:w-[130%] lg:w-[150%] xl:w-[180%] 2xl:w-[200%]
//                                    drop-shadow-[0_0_40px_rgba(255,234,0,0.7)] 
//                                    translate-x-[15%] md:translate-x-[25%] lg:translate-x-[30%] xl:translate-x-[20%] 
//                                    -translate-y-[10%] md:-translate-y-[5%]" // Slightly lift to center vertically
//                         onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src='https://placehold.co/400x400/101010/FFEA00?text=3D+Scene'; }}
//                     />
//                 </div>
//             </div>
//         </div>


//     );
// };


// const FeatureRow: React.FC = () => {
//     // 1. Define the features with Pikachu added
//     const features = [
//         { 
//             name: "Pikachu", 
//             image: "/images/pikachu_starter.png", // Assuming you have a starter image for Pikachu
//             color: "bg-yellow-500", // Bright yellow for Pikachu's container
//             description: "The iconic \"Electric Pokémon.\" Choosing Pikachu channels boundless energy and lightning-fast critical thinking. It is the perfect partner for trainers seeking electric efficiency and impactful, dynamic solutions." 
//         },
//         { 
//             name: "Bulbasaur", 
//             image: "/images/bulbasaur_starter.png", 
//             color: "bg-[#2563EB]", 
//             description: "The original \"Bulb Pokémon.\" Choosing Bulbasaur means embracing the power of balanced learning and strategic growth. It's the steadfast companion for trainers who value a solid foundation, ready to bloom into comprehensive expertise." 
//         },
//         { 
//             name: "Squirtle", 
//             image: "/images/squirtle_starter.png", 
//             color: "bg-[#10B981]", 
//             description: "The original \"Tiny Turtle Pokémon.\" Squirtle is the perfect choice for trainers focused on analytical thinking and precise execution. Choose Squirtle to master the art of controlled research and emerge victorious through pure reason." 
//         },
//         { 
//             name: "Charmander", 
//             image: "/images/charmander_starter.png", 
//             color: "bg-[#F59E0B]", 
//             description: "The original \"Lizard Pokémon.\" Choosing Charmander ignites your journey with passion and speed. Its tail flame reflects your unquenchable thirst for knowledge, mirroring your own limitless academic ambition." 
//         },
//     ];

//     return (
//         <section className="py-20 bg-black text-white px-4">
//             <div className="max-w-6xl mx-auto text-center">
                
//                 {/* Headers */}
//                 <p className="text-yellow-400 font-semibold mb-2 text-3xl">Discover the Wonders of Pokémon</p>
//                 <h3 className="text-6xl font-extrabold mb-6">Explore the Pokémon World</h3>
//                 <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-12">
//                     Join us on a captivating Pokémon journey where you'll choose a starter Pokémon, watch it hatch from an egg, 
//                     and train to become a master.
//                 </p>

//                 {/* Feature Cards Grid: CHANGED to grid-cols-4 for desktop (lg:), but kept md:grid-cols-3 for medium screens if needed, and cols-1 for mobile. */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
//                     {features.map((feature) => {
//                         // Dynamically determine the Tailwind gradient classes
//                         let titleClasses = "text-2xl font-bold mb-2 ";

//                         if (feature.name === 'Pikachu') {
//                             // Electric Yellow Gradient for Pikachu ⚡
//                             titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500';
//                         } else if (feature.name === 'Bulbasaur') {
//                             // Enhanced Green Gradient
//                             titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-600';
//                         } else if (feature.name === 'Squirtle') {
//                             // Enhanced Blue Gradient
//                             titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-600';
//                         } else if (feature.name === 'Charmander') {
//                             // Reddish Orange Gradient
//                             titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600';
//                         } else {
//                             // Default fallback
//                             titleClasses += 'text-white';
//                         }

//                         return (
//                             <div 
//                                 key={feature.name} 
//                                 className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl transition transform hover:scale-[1.03] duration-300 border border-gray-700 hover:border-yellow-400"
//                             >
//                                 {/* Circular Image Container */}
//                                 <div className="flex justify-center mb-6">
//                                     <div className={`w-40 h-40 flex items-center justify-center rounded-full p-2 ${feature.color} shadow-inner shadow-black/20 overflow-hidden`}>
//                                         <img
//                                             src={feature.image}
//                                             alt={feature.name}
//                                             className="w-full h-full object-cover drop-shadow-lg scale-175 transform -translate-y-2" 
//                                             onError={(e) => { e.currentTarget.src = `https://placehold.co/160x160/${feature.color.replace('bg-[#','').replace(']','')}/white?text=${feature.name}`; }}
//                                         />
//                                     </div>
//                                 </div>
                                
//                                 {/* Apply the dynamic gradient class to the title */}
//                                 <h4 className={titleClasses}>
//                                     {feature.name}
//                                 </h4>
                                
//                                 <p className="text-gray-400 text-sm">
//                                     {feature.description}
//                                 </p>
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>
//         </section>
//     );
// }



//     return (
//         <div className="flex flex-col min-h-screen bg-black relative overflow-hidden font-inter">
//             {/* Header/Nav for Landing Page */}
//             <nav className="relative z-20 w-full p-6 flex justify-between items-center bg-black/50 backdrop-blur-sm">
//                 <div className="flex items-center space-x-2 text-white text-3xl font-bold">
//                     <Egg className="w-7 h-7 text-yellow-300 fill-yellow-300" />
//                     <span className="text-yellow-300">Poke</span><span className="text-white">Quest</span>
//                 </div>
//                 {/* Desktop Menu */}
//                 <div className="hidden sm:flex items-center space-x-6">
//                     <button onClick={onStartJourney} className="px-5 py-2 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition shadow-xl">
//                         Start Journey
//                     </button>
//                 </div>
//                 {/* Mobile Login Button */}
//                 <button onClick={onStartJourney} className="sm:hidden px-3 py-1 bg-red-500 text-white font-bold rounded-full">
//                     Login
//                 </button>
//             </nav>

//             {/* Hero Section */}
//             <header className="flex flex-col md:flex-row relative overflow-hidden min-h-[calc(100vh-80px)] bg-black">
//                 {/* Background Image Container */}
//                 <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
//                     <img
//                         src='/images/hero_pikachu.png'
//                         alt="A stylized illustration of Pikachu welcoming users."
//                         className="object-contain w-full h-full md:w-[60vw] md:h-full lg:w-[50vw] xl:w-[45vw]
//                                  md:absolute md:right-0 md:bottom-0 md:translate-x-[15%] md:translate-y-[15%]
//                                  lg:translate-x-[10%] lg:translate-y-[10%] xl:translate-x-[0%] xl:translate-y-[10%]
//                                  mix-blend-lighten opacity-30 sm:opacity-90"
//                         onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src='https://placehold.co/800x800/000000/F5D04C?text=Pikachu+Placeholder'; }}
//                     />
//                 </div>

//                 {/* Content Container */}
//                 <div className="relative z-10 flex flex-col justify-center items-center md:items-start w-full md:w-1/2 mr-auto p-8 lg:p-16 text-center md:text-left">
//                     <h2 className="text-6xl lg:text-7xl font-black text-white leading-tight mb-4 tracking-tighter drop-shadow-lg">
//                         Train Smarter, <br className="hidden md:inline"/> Become a Master.
//                     </h2>
                    
//                     {/* Tagline/Description */}
//                     <p className="text-lg text-gray-300 mb-10 max-w-lg mx-auto md:mx-0">
//                         Welcome to PokeQuest! Every lesson is a new challenge. Choose your research topic, hatch a brilliant insight, and begin your quest to discover your potential and become an expert trainer.
//                     </p>

//                     {/* Action Buttons */}
//                     <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center md:justify-start">
//                         <button
//                             onClick={onStartJourney}
//                             className="flex items-center justify-center bg-yellow-300 text-white font-bold py-4 px-8 rounded-xl shadow-2xl
//                                      hover:bg-yellow-300 transition duration-300 text-lg transform hover:scale-[1.05] ring-2 ring-red-300/50"
//                         >
//                             <Zap className="w-5 h-5 mr-2" /> Start Your Quest
//                         </button>
                        
//                         <a href="#features" className="flex items-center justify-center border-2 border-gray-500 text-gray-300 font-bold py-4 px-8 rounded-xl
//                                      hover:border-yellow-300 hover:text-yellow-300 transition duration-300 text-lg">
//                             <BookOpen className="w-5 h-5 mr-2" /> Explore Features
//                         </a>
//                     </div>
//                 </div>
//             </header>
            
//             {/* Feature Row (Placed after the Hero Section) */}
//             <div id="features" className="bg-gray-900">
//                 <FeatureRow />
//                 <WelcomeScreen />
//             </div>
//         </div>
        
  
//     );
// };


// // --- Component: MainLayout (New Wrapper for Logged-in Pages - CUTE THEME APPLIED) ---
// type LoggedInScreen = 'dashboard' | 'leaderboard' | 'quiz_select' | 'quiz_battle';

// interface MainLayoutProps {
//     dashboardData: DashboardData | null;
//     loadingDashboard: boolean;
//     fetchDashboardData: () => void;
//     logout: () => void;
// }

// const MainLayout: React.FC<MainLayoutProps> = ({ dashboardData, loadingDashboard, fetchDashboardData, logout }) => {
//     // Initial state set to 'dashboard'
//     const [currentScreen, setCurrentScreen] = useState<LoggedInScreen>('dashboard');
//     const [currentSubject, setCurrentSubject] = useState<string>('');
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
//     // Handlers
//     const handleStartQuiz = (subject: string) => {
//         setCurrentSubject(subject);
//         setCurrentScreen('quiz_battle'); // Navigate to the active quiz battle
//         setIsSidebarOpen(false); 
//     };

//     const handleQuizComplete = (data: { score: number; weak_topics: string[] }) => {
//         console.log("Quiz completed and results submitted. Updating dashboard stats.");
//         fetchDashboardData(); 
//         setCurrentScreen('dashboard'); // Return to dashboard after completion
//     };
    
//     const handleExitQuiz = () => {
//         setCurrentScreen('quiz_select'); // If user exits quiz mid-way, return to subject selection
//     };
    
//     const handleViewLeaderboard = () => {
//         setCurrentScreen('leaderboard');
//         setIsSidebarOpen(false); 
//     }
    
//     const navigate = (screen: LoggedInScreen) => {
//         setCurrentScreen(screen);
//         setIsSidebarOpen(false); 
//     }

//     // Nav Items
//     const navItems = [
//         { name: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard },
//         { name: 'Leaderboard', screen: 'leaderboard', icon: Trophy },
//         // Updated to target the dedicated subject selection screen
//         { name: 'Start Quiz Battle', screen: 'quiz_select', icon: Zap }, 
//     ];
    
//     // Render Screen Content
//     let screenContent;
//     switch (currentScreen) {
//         case 'dashboard':
//             screenContent = loadingDashboard ? (
//                 <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl shadow-2xl h-96 w-full max-w-4xl mx-auto border-4 border-red-500">
//                     <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
//                     <p className="text-gray-900 font-black text-xl">Loading Trainer Data...</p>
//                 </div>
//             ) : (
//                 // Dashboard no longer handles quiz selection
//                 <Dashboard 
//                     onStartQuiz={handleStartQuiz} 
//                     dashboardData={dashboardData} 
//                     onViewLeaderboard={() => navigate('leaderboard')}
//                 />
//             );
//             break;
//         case 'leaderboard':
//             screenContent = <LeaderboardScreen />;
//             break;
//         case 'quiz_select':
//             screenContent = (
//                 // New dedicated subject selection screen
//                 <QuizSubjectSelectionScreen 
//                     onStartQuiz={handleStartQuiz}
//                     dashboardData={dashboardData}
//                 />
//             );
//             break;
//         case 'quiz_battle':
//             screenContent = (
//                 // Active quiz session
//                 <QuizBattle 
//                     subject={currentSubject} 
//                     onQuizComplete={handleQuizComplete} 
//                     onExit={handleExitQuiz} 
//                 />
//             );
//             break;
//         default:
//             screenContent = <p className="text-gray-900">Select a navigation link.</p>;
//     }

//     return (
//         // Main container uses a soft, light background gradient
//         <div className="flex min-h-screen bg-gradient-to-br from-red-50 to-blue-100">
//             {/* Sidebar (Desktop) and Mobile Menu - Vibrant Red/White/Blue Theme */}
//             <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
//                                 lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out 
//                                 w-72 bg-white shadow-2xl shadow-blue-300/50 border-r-4 border-blue-500 z-30 flex flex-col rounded-r-3xl`}>
                
//                 {/* Logo and Close Button */}
//                 <div className="p-6 flex items-center justify-between border-b-2 border-gray-200 h-24">
//                     <div className="flex items-center space-x-2 text-4xl font-black">
//                         <Egg className="w-8 h-8 text-red-500 fill-red-500 drop-shadow-md" />
//                         <span className="text-red-500">Poke</span><span className="text-gray-900">Quest</span>
//                     </div>
//                     <button 
//                         className="lg:hidden text-gray-500 hover:text-red-500 p-2 rounded-full bg-gray-100"
//                         onClick={() => setIsSidebarOpen(false)}
//                     >
//                         <X className="w-6 h-6" />
//                     </button>
//                 </div>

//                 {/* Navigation Links */}
//                 <nav className="flex-grow p-6 space-y-3">
//                     {navItems.map(item => (
//                         <button
//                             key={item.name}
//                             // Navigate directly to the corresponding screen state
//                             onClick={() => navigate(item.screen as LoggedInScreen)} 
//                             className={`flex items-center w-full px-5 py-4 rounded-xl font-black transition-all duration-300 
//                                 ${currentScreen === item.screen || (item.screen === 'quiz_select' && currentScreen === 'quiz_battle') 
//                                     ? 'bg-blue-600 text-white shadow-xl shadow-blue-400/50 transform scale-[1.02] border-2 border-yellow-300'
//                                     : 'text-gray-700 hover:bg-red-100 hover:text-blue-500 shadow-md'
//                                 }`}
//                         >
//                             <item.icon className="w-6 h-6 mr-3" />
//                             {item.name}
//                         </button>
//                     ))}
//                 </nav>

//                 {/* Footer/Logout */}
//                 <div className="p-6 border-t-2 border-gray-200">
//                     <p className="text-base font-semibold text-gray-500 mb-1 truncate">
//                         Current Trainer:
//                     </p>
//                     <p className="text-xl font-black text-gray-900 mb-4 truncate">
//                         {dashboardData?.trainer_card.username || 'Loading...'}
//                     </p>
//                     <button
//                         onClick={logout}
//                         className="flex items-center w-full px-4 py-3 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 transition shadow-lg"
//                     >
//                         <XCircle className="w-5 h-5 mr-2" /> Log Out
//                     </button>
//                 </div>
//             </aside>

//             {/* Main Content Area */}
//             <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 relative">
//                 {/* Pokémon Background Animation (Subtle) */}
//                 <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
//                     <div className="w-16 h-16 bg-red-400/50 rounded-full absolute top-[10%] left-[5%] animate-float-slow"></div>
//                     <div className="w-24 h-24 bg-yellow-400/50 rounded-full absolute top-[50%] right-[15%] animate-float-medium"></div>
//                     <div className="w-12 h-12 bg-blue-400/50 rounded-full absolute bottom-[5%] left-[30%] animate-float-fast"></div>
//                 </div>

//                 {/* Mobile Header for Menu Button */}
//                 <header className="flex justify-between items-center lg:hidden sticky top-0 bg-white/95 backdrop-blur-md z-20 py-4 mb-4 rounded-b-xl border-b border-red-500/50 shadow-md">
//                      <div className="flex items-center space-x-2 text-2xl font-bold">
//                         <Egg className="w-6 h-6 text-red-500 fill-red-500" />
//                         <span className="text-red-500">Poke</span><span className="text-gray-900">Quest</span>
//                     </div>
//                     <button 
//                         onClick={() => setIsSidebarOpen(true)}
//                         className="p-2 bg-red-500 text-white rounded-xl shadow-xl hover:bg-red-600 transition"
//                     >
//                         <Menu className="w-6 h-6" />
//                     </button>
//                 </header>
                
//                 {/* Conditional Content Render (z-10 ensures it's above the floating BG elements) */}
//                 <div className="relative z-10">
//                     {screenContent}
//                 </div>
//             </div>
//         </div>
//     );
// };


// // --- Custom Keyframe CSS for animation (included directly in JSX via style/tailwind classes) ---
// const styleTag = document.createElement('style');
// styleTag.innerHTML = `
//     @keyframes pulse-slow {
//         0%, 100% { transform: scale(1.0) translateX(0px); opacity: 1; }
//         50% { transform: scale(1.03) translateX(2px); opacity: 0.95; }
//     }
//     .animate-pulse-slow {
//         animation: pulse-slow 5s infinite ease-in-out;
//     }
//     @keyframes float-slow {
//         0%, 100% { transform: translateY(0) translateX(0); }
//         50% { transform: translateY(-10px) translateX(10px); }
//     }
//     .animate-float-slow {
//         animation: float-slow 15s infinite ease-in-out;
//     }
//     @keyframes float-medium {
//         0%, 100% { transform: translateY(0) translateX(0); }
//         50% { transform: translateY(8px) translateX(-5px); }
//     }
//     .animate-float-medium {
//         animation: float-medium 10s infinite ease-in-out;
//     }
//     @keyframes float-fast {
//         0%, 100% { transform: translateY(0) translateX(0); }
//         50% { transform: translateY(-5px) translateX(5px); }
//     }
//     .animate-float-fast {
//         animation: float-fast 7s infinite ease-in-out;
//     }
// `;
// document.head.appendChild(styleTag);


// // --- Component: App (State Management & Global Wrapper) ---
// type Screen = 'landing' | 'login' | 'main'; 

// const App: React.FC = () => {
//     const { isLoggedIn, login, logout, token } = useAuth();
    
//     // Determine initial screen based on auth state
//     const initialScreen = isLoggedIn ? 'main' : 'landing';
//     const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);
    
//     const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
//     const [loadingDashboard, setLoadingDashboard] = useState(false);
    
//     // Ensures state sync on login/logout
//     useEffect(() => {
//         if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'landing')) {
//             setCurrentScreen('main');
//         } else if (!isLoggedIn && currentScreen === 'main') {
//             setCurrentScreen('landing');
//         }
//     }, [isLoggedIn, currentScreen]);

//     const fetchDashboardData = useCallback(async () => {
//         if (!token) return;

//         setLoadingDashboard(true);
//         try {
//             const maxRetries = 3;
//             let response = null;
//             let data = null;
            
//             for (let i = 0; i < maxRetries; i++) {
//                 try {
//                     response = await fetch('http://127.0.0.1:5000/api/dashboard', {
//                         method: 'GET',
//                         headers: { 'Authorization': `Bearer ${token}` },
//                     });
//                     data = await response.json();
                    
//                     if (response.ok && !data.error) {
//                         break; 
//                     } else if (i === maxRetries - 1) {
//                          throw new Error(data.error || 'Failed to fetch dashboard data after multiple retries.');
//                     }
//                 } catch (e) {
//                      if (i === maxRetries - 1) {
//                         throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
//                     }
//                     await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
//                 }
//             }

//             setDashboardData(data);
//         } catch (error) {
//             console.error("Dashboard Fetch Error:", error);
//         } finally {
//             setLoadingDashboard(false);
//         }
//     }, [token]);

//     useEffect(() => {
//         if (isLoggedIn) {
//             fetchDashboardData();
//         }
//     }, [isLoggedIn, fetchDashboardData]);

//     // Handlers
//     const handleStartJourney = () => {
//         setCurrentScreen('login');
//     };

//     const handleLoginSuccess = (authToken: string, userId: string) => {
//         login(authToken, userId);
//         setCurrentScreen('main');
//     };

//     // --- Render Current Screen ---
//     const renderScreen = () => {
//         if (currentScreen === 'landing') {
//             return <LandingScreen onStartJourney={handleStartJourney} />;
//         }
        
//         if (currentScreen === 'login') {
//             return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
//         }
        
//         if (currentScreen === 'main' && isLoggedIn) {
//             return (
//                 <MainLayout
//                     dashboardData={dashboardData}
//                     loadingDashboard={loadingDashboard}
//                     fetchDashboardData={fetchDashboardData}
//                     logout={logout}
//                 />
//             );
//         }
        
//         // Fallback or while redirecting
//         return (
//              <div className="min-h-screen flex items-center justify-center bg-black text-white">
//                 <Loader2 className="w-10 h-10 animate-spin text-red-500" />
//             </div>
//         );
//     };

//     return (
//         <div className="font-inter">
//             {renderScreen()}
//         </div>
//     );
// };

// export default App;












'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Heart, Zap, Award, BookOpen, ChevronRight, CheckCircle, XCircle, 
    Loader2, User, Star, TrendingUp, Trophy, Egg, LayoutDashboard, Menu, X, MonitorPlay
} from 'lucide-react';

// --- Types for Data (Unchanged) ---
interface Question {
    id: number;
    question: string;
    options: string[];
    answer: string;
    topic: string;
    selectedAnswer: string | null;
    isCorrect: boolean | null;
}

interface QuizData {
    quiz_title: string;
    questions: Question[];
}

interface TrainerCardData {
    user_id: string;
    username: string;
    level: number;
    xp: number;
    streak: number;
}

interface PokemonPanelData {
    name: string;
    xp_stat: string;
    total_xp: number;
    evolution_status: string;
    image_url: string; 
}

interface DashboardData {
    trainer_card: TrainerCardData;
    pokemon_panel: PokemonPanelData;
    achievements: { badges: number };
    last_weak_topics: string[];
}

interface LeaderboardEntry {
    username: string;
    xp: number;
    level: number;
    pokemon_name: string;
}

// --- Mock Auth Context (Unchanged) ---
const useAuth = () => {
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // NOTE: In a production environment, localStorage is generally replaced 
    // by secure HTTP-only cookies and Firebase/Firestore for user data persistence.
    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUserId = localStorage.getItem('user_id');
        if (storedToken && storedUserId) {
            setToken(storedToken);
            setUserId(storedUserId);
            setIsLoggedIn(true);
        }
    }, []);

    const login = (authToken: string, uid: string) => {
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user_id', uid);
        setToken(authToken);
        setUserId(uid);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        setToken(null);
        setUserId(null);
        setIsLoggedIn(false);
    };

    return { token, userId, isLoggedIn, login, logout };
};

// --- Component: Quiz Question Renderer ---
interface QuizQuestionProps {
    question: Question;
    questionIndex: number;
    totalQuestions: number;
    handleOptionSelect: (option: string) => void;
    isSubmissionReview: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
    question,
    questionIndex,
    totalQuestions,
    handleOptionSelect,
    isSubmissionReview,
}) => {
    const { question: text, options, selectedAnswer, answer, topic } = question;

    const getOptionClasses = (option: string) => {
        let classes = 'p-4 my-3 rounded-2xl transition-all duration-300 border-2 text-lg font-semibold ';

        if (isSubmissionReview) {
            if (option === answer) {
                classes += 'bg-green-100 border-green-500 text-green-800 shadow-lg';
            } else if (option === selectedAnswer && option !== answer) {
                classes += 'bg-red-100 border-red-500 text-red-800 shadow-lg';
            } else {
                classes += 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100';
            }
        } else {
            classes += 'cursor-pointer hover:bg-yellow-50 hover:shadow-md';
            if (option === selectedAnswer) {
                classes += 'bg-red-500 border-red-700 shadow-xl shadow-red-300/50 text-white';
            } else {
                classes += 'bg-white border-gray-300 text-gray-800';
            }
        }
        return classes;
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-red-300/40 w-full mx-auto transform transition-all duration-300 border-4 border-red-500">
            <div className="text-sm font-black text-red-500 mb-2 tracking-widest">
                QUESTION {questionIndex + 1} / {totalQuestions}
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">{text}</h3>
            <p className="text-xs text-gray-500 mb-6 italic border-b border-gray-300 pb-2">Topic: {topic}</p>

            {options.map((option, index) => (
                <div
                    key={index}
                    className={getOptionClasses(option)}
                    onClick={!isSubmissionReview ? () => handleOptionSelect(option) : undefined}
                >
                    {option}
                    {isSubmissionReview && option === answer && (
                        <CheckCircle className="inline w-5 h-5 ml-2 text-green-600" />
                    )}
                    {isSubmissionReview && option === selectedAnswer && option !== answer && (
                        <XCircle className="inline w-5 h-5 ml-2 text-red-600" />
                    )}
                </div>
            ))}

            {isSubmissionReview && selectedAnswer && (
                <p className={`mt-6 p-3 rounded-xl text-sm font-black ${question.isCorrect ? 'bg-green-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md'}`}>
                    {question.isCorrect ? 'Awesome! Correct answer!' : `Oops! The correct answer was: "${answer}".`}
                </p>
            )}
        </div>
    );
};


// --- Component: Quiz Battle (Page 3 - Active Quiz) ---
interface QuizBattleProps {
    subject: string;
    onQuizComplete: (data: { score: number; weak_topics: string[] }) => void;
    onExit: () => void;
}

const QuizBattle: React.FC<QuizBattleProps> = ({ subject, onQuizComplete, onExit }) => {
    const { token } = useAuth();
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isReviewing, setIsReviewing] = useState(false); 
    const [submissionResult, setSubmissionResult] = useState<any>(null);
    
    const [timeLeft, setTimeLeft] = useState(60); 

    useEffect(() => {
        if (quiz && !isReviewing) {
            setTimeLeft(60);
        }
    }, [currentQuestionIndex, quiz, isReviewing]);

    useEffect(() => {
        if (loading || isReviewing) return; 

        if (timeLeft <= 0) {
            handleTimeExpired();
            return;
        }

        const timerId = setTimeout(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearTimeout(timerId); 
    }, [timeLeft, currentQuestionIndex, loading, isReviewing]);

    const handleTimeExpired = () => {
        if (!quiz) return;
        
        setQuiz(prevQuiz => {
            if (!prevQuiz) return null;

            const updatedQuestions = prevQuiz.questions.map((q, index) => {
                if (index === currentQuestionIndex && q.selectedAnswer === null) {
                    return { ...q, selectedAnswer: "Time Expired / No Answer", isCorrect: false }; 
                }
                return q;
            });

            return { ...prevQuiz, questions: updatedQuestions };
        });

        handleNext(true); 
    };

    const fetchQuiz = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!token) {
            setError("Authentication token missing. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            // Using exponential backoff for API calls
            const maxRetries = 3;
            let response = null;
            let data = null;
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/api/generate_quiz', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ subject }),
                    });
                    
                    data = await response.json();
                    
                    if (response.ok && !data.error) {
                        break; 
                    } else if (i === maxRetries - 1) {
                         throw new Error(data.error || 'Failed to generate quiz after multiple retries.');
                    }
                } catch (e) {
                    if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }


            const initializedQuestions: Question[] = data.questions.map((q: any, index: number) => ({
                ...q,
                id: index, 
                selectedAnswer: null,
                isCorrect: null,
            }));

            setQuiz({ ...data, questions: initializedQuestions });
            setTimeLeft(60); 
        } catch (err: any) {
            console.error("Quiz Fetch Error:", err);
            setError(err.message || "An unknown error occurred while fetching the quiz.");
        } finally {
            setLoading(false);
        }
    }, [subject, token]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    const handleOptionSelect = (option: string) => {
        if (isReviewing) return;

        setQuiz(prevQuiz => {
            if (!prevQuiz) return null;

            const updatedQuestions = prevQuiz.questions.map((q, index) => {
                if (index === currentQuestionIndex) {
                    const isCorrect = option === q.answer;
                    return { ...q, selectedAnswer: option, isCorrect }; 
                }
                return q;
            });

            return { ...prevQuiz, questions: updatedQuestions };
        });
    };

    const handleNext = (forceSubmit = false) => {
        if (!forceSubmit && (!quiz || !quiz.questions[currentQuestionIndex].selectedAnswer)) {
            console.log("Please select an option before moving to the next question!");
            return;
        }

        setTimeLeft(60); 

        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if (!quiz) return;

        let score = 0;
        const topicIncorrectCounts: Record<string, number> = {};

        quiz.questions.forEach(q => {
            if (q.isCorrect) {
                score++;
            } else {
                if (q.topic) {
                    topicIncorrectCounts[q.topic] = (topicIncorrectCounts[q.topic] || 0) + 1;
                }
            }
        });

        // Filter for topics where at least one question was answered incorrectly
        const finalWeakTopics = Object.keys(topicIncorrectCounts).filter(topic => topicIncorrectCounts[topic] > 0);


        setLoading(true);
        
        // --- Submission API Call with Backoff ---
        const submitQuiz = async () => {
             const maxRetries = 3;
            let response = null;
            let data = null;
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/api/submit_quiz', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            subject,
                            score,
                            total_questions: quiz.questions.length,
                            new_weak_topics: finalWeakTopics,
                        }),
                    });

                    data = await response.json();
                    
                    if (response.ok && !data.error) {
                        return data;
                    } else if (i === maxRetries - 1) {
                         throw new Error(data.error || 'Failed to submit quiz after multiple retries.');
                    }
                } catch (e) {
                     if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
        }
        
        submitQuiz()
        .then(data => {
            setLoading(false);
            
            setIsReviewing(true); 
            setSubmissionResult(data); 
            setCurrentQuestionIndex(0); 
        })
        .catch(err => {
            console.error("Submission Error:", err);
            setError(err.message || "Failed to submit results.");
            setLoading(false);
        });
        
    };
    
    const handleReviewComplete = () => {
        if (submissionResult) {
            onQuizComplete(submissionResult);
        } else {
            onExit(); // Fallback
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl shadow-2xl h-96 w-full max-w-2xl mx-auto border-4 border-red-500">
                <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
                <p className="text-gray-900 font-black text-xl">Generating Personalized Quiz on {subject}...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait for the AI battle to commence!</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 bg-red-100 border border-red-500 rounded-xl shadow-2xl w-full max-w-2xl mx-auto text-red-800">
                <h3 className="text-xl font-bold text-red-600 mb-3">Quiz Error</h3>
                <p className="text-red-500">{error}</p>
                <button
                    onClick={onExit}
                    className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-10 bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto text-gray-900">
                <p className="text-lg font-semibold text-gray-500">Quiz data is unavailable.</p>
                <button
                    onClick={onExit}
                    className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
                >
                    Return
                </button>
            </div>
        );
    }

    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const nextButtonText = isLastQuestion ? 'Submit Quiz' : 'Next Question';
    const nextButtonDisabled = !currentQuestion.selectedAnswer && !isReviewing;

    const timerClasses = `text-3xl font-black ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-gray-900 mb-8 text-center border-b-4 border-red-500/50 pb-3">
                {isReviewing ? 'Quiz Review' : quiz.quiz_title}
            </h2>
            
            {!isReviewing && (
                <div className="text-center mb-8">
                    <div className="p-4 bg-yellow-400 rounded-full shadow-xl inline-block border-4 border-white animate-bounce-slow">
                        <span className="text-xs text-black block mb-1 font-extrabold tracking-widest">TIME</span>
                        <span className={timerClasses}>{timeLeft}s</span>
                    </div>
                </div>
            )}
            
            {/* Quiz Question */}
            <QuizQuestion
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                totalQuestions={quiz.questions.length}
                handleOptionSelect={handleOptionSelect}
                isSubmissionReview={isReviewing}
            />

            {/* Navigation Buttons */}
            <div className={`mt-10 flex ${isReviewing ? 'justify-between' : 'justify-end'} space-x-6 w-full max-w-lg mx-auto`}>
                {isReviewing && (
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-xl shadow-lg hover:bg-gray-400 transition disabled:opacity-50 transform hover:scale-[1.05]"
                    >
                        <ChevronRight className="inline w-5 h-5 mr-1 transform rotate-180" /> Back
                    </button>
                )}
                
                {isReviewing ? (
                    <button
                        onClick={handleReviewComplete} 
                        className="px-8 py-4 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-400/50 hover:bg-green-600 transition transform hover:scale-[1.05]"
                    >
                        Finished Reviewing
                    </button>
                ) : (
                    <button
                        onClick={() => handleNext(false)} 
                        disabled={nextButtonDisabled}
                        className={`px-10 py-4 font-black text-xl rounded-2xl transition duration-300 transform shadow-2xl
                            ${nextButtonDisabled
                                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                : 'bg-red-500 text-white hover:bg-red-600 hover:scale-[1.03] ring-4 ring-yellow-400/50'
                            }
                        `}
                    >
                        {nextButtonText} <ChevronRight className="inline w-6 h-6 ml-1" />
                    </button>
                )}
            </div>
            
            {isReviewing && (
                <div className="mt-8 p-4 bg-yellow-50 border-4 border-yellow-400 rounded-xl w-full max-w-lg mx-auto shadow-inner">
                    <p className="text-center font-black text-2xl text-red-600">
                        Final Score: {quiz.questions.filter(q => q.isCorrect).length} / {quiz.questions.length}
                    </p>
                </div>
            )}
        </div>
    );
};


// --- Helper StatCard (Simple, Red/Yellow) ---
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
    <div className="flex items-center p-4 bg-gray-100 rounded-xl shadow-lg border border-gray-300">
        <div className="p-3 bg-red-100 rounded-full mr-4 shadow-inner">
            {/* Clone element to force color on the icon */}
            {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 text-red-500' })}
        </div>
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
    </div>
);


// --- Component: Dashboard (Page 1 Content - RESTORED UI + Pomodoro) ---
interface DashboardProps {
    onStartQuiz: (subject: string) => void;
    dashboardData: DashboardData | null; 
    onViewLeaderboard: () => void;
    // NEW POMODORO PROPS
    pomodoroStatus: 'resting' | 'active' | 'breaking';
    pomodoroTimeLeft: number;
    handlePomodoroToggle: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ dashboardData, onViewLeaderboard, pomodoroStatus, pomodoroTimeLeft, handlePomodoroToggle }) => {
    
    const weakTopics = dashboardData?.last_weak_topics || [];
    const trainer = dashboardData?.trainer_card;
    const pokemon = dashboardData?.pokemon_panel;
    
    const xp_parts = pokemon?.xp_stat.split('/');
    const current_xp_mod = parseInt(xp_parts?.[0] || '0');
    const required_xp_mod = parseInt(xp_parts?.[1] || '300');
    const xp_percent = required_xp_mod > 0 ? Math.min(100, (current_xp_mod / required_xp_mod) * 100) : 0;

    // Default image URL (since original was not provided)
    const pokemonImageUrl = pokemon?.image_url || 'https://placehold.co/128x128/999999/white?text=Partner+Pokemon';
    
    // POMODORO LOGIC FOR DISPLAY
    const POMODORO_WORK_DURATION = 25 * 60;
    
    let fatigueBarPercent = 0;
    let fatigueBarColor = 'bg-green-500';
    let fatigueBarText = 'Ready to Train!';
    let timerMins = Math.floor(pomodoroTimeLeft / 60);
    let timerSecs = pomodoroTimeLeft % 60;
    const timerDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

    if (pomodoroStatus === 'active') {
        // Fatigue decreases from 100% (full energy) to 0% (depleted) in 25 mins
        const energyLeft = pomodoroTimeLeft;
        fatigueBarPercent = (energyLeft / POMODORO_WORK_DURATION) * 100;
        fatigueBarColor = fatigueBarPercent > 50 ? 'bg-green-500' : (fatigueBarPercent > 20 ? 'bg-yellow-500' : 'bg-red-500');
        fatigueBarText = `Training Active: ${timerDisplay} left`;
    } else if (pomodoroStatus === 'breaking') {
        // Fatigue recovers from 0% (depleted) to 100% (full energy)
        const breakElapsed = (5 * 60) - pomodoroTimeLeft;
        const totalBreakDuration = 5 * 60;
        fatigueBarPercent = (breakElapsed / totalBreakDuration) * 100;
        fatigueBarColor = 'bg-blue-500';
        fatigueBarText = `Break Time: ${timerDisplay} left (Resting)`;
    } else { // resting
        fatigueBarPercent = 100;
        fatigueBarColor = 'bg-green-500';
    }

    const buttonText = pomodoroStatus === 'active' ? 'Training Active...' : (pomodoroStatus === 'breaking' ? 'Pokémon Resting...' : 'Start Pomodoro Mode');
    const buttonDisabled = pomodoroStatus !== 'resting';

    return (
        // Restored original dashboard wrapper style
        <div className="p-6 md:p-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border-4 border-red-500/50">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 border-red-500 pb-4">Trainer Dashboard</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Trainer Card & Stats */}
                <div className="lg:col-span-2 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl shadow-inner">
                    <h2 className="text-2xl font-bold text-red-500 mb-4 flex items-center">
                        <User className="w-6 h-6 mr-2 text-red-500" />
                        Trainer Card
                    </h2>
                    {trainer ? (
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard icon={<User />} label="Username" value={trainer.username} color="bg-blue-500" />
                            <StatCard icon={<Star />} label="Level" value={trainer.level} color="bg-yellow-500" />
                            <StatCard icon={<Zap />} label="Total XP" value={trainer.xp} color="bg-red-500" />
                            <StatCard icon={<TrendingUp />} label="Streak" value={trainer.streak} color="bg-green-500" />
                            <StatCard icon={<Award />} label="Badges" value={dashboardData?.achievements.badges || 0} color="bg-purple-500" />
                            <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                                <button
                                    onClick={onViewLeaderboard}
                                    className="flex items-center w-full justify-center px-4 py-3 bg-red-500 text-white font-black rounded-xl shadow-lg 
                                             hover:bg-red-600 transition duration-300 transform hover:scale-[1.02] ring-2 ring-yellow-400/50"
                                >
                                    <Trophy className="w-5 h-5 mr-2 text-white" /> Global Rankings
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Loading trainer data...</p>
                    )}
                </div>

                {/* Pokémon Panel - Restored Red Theme */}
                <div className="lg:col-span-1 p-6 bg-red-50 border-4 border-red-500 rounded-xl shadow-2xl flex flex-col items-center text-center">
                    <h2 className="text-xl font-extrabold text-red-800 mb-4">
                        {pokemon?.name || 'Loading...'}
                    </h2>
                    
                    <div className="w-24 h-24 mb-4 border-4 border-red-500 shadow-xl rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
                        <img 
                            src={pokemonImageUrl} 
                            alt={`${pokemon?.name} evolution stage`} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/96x96/999999/white?text=Error'; }} 
                        />
                    </div>
                    
                    <p className="text-sm font-semibold text-gray-900">{pokemon?.evolution_status || 'Checking Status...'}</p>

                    <div className="w-full mt-4">
                        <p className="text-xs font-bold text-gray-500 mb-1 flex justify-between">
                            <span>XP Progress</span>
                            <span>{pokemon?.xp_stat || '0/300'}</span>
                        </p>
                        <div className="w-full bg-gray-300 rounded-full h-4 shadow-inner">
                            <div 
                                className="h-4 bg-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${xp_percent}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* NEW FATIGUE BAR INTEGRATION */}
                    <div className="w-full mt-6 p-3 bg-gray-100 rounded-xl shadow-inner border border-gray-300">
                        <p className="text-xs font-black text-gray-600 mb-1 flex justify-between">
                            <span>POKÉMON FATIGUE / ENERGY</span>
                            <span className="text-sm font-extrabold text-gray-800">{fatigueBarPercent.toFixed(0)}%</span>
                        </p>
                        <div className="w-full bg-gray-300 rounded-full h-4 shadow-md overflow-hidden">
                            <div 
                                className={`h-4 ${fatigueBarColor} rounded-full transition-all duration-700 ease-out`}
                                style={{ width: `${fatigueBarPercent}%` }}
                            ></div>
                        </div>
                        <p className={`text-xs mt-2 font-bold ${pomodoroStatus === 'breaking' ? 'text-blue-600' : 'text-gray-800'}`}>{fatigueBarText}</p>
                    </div>
                </div>

            </div>
            
            {/* Pomodoro Activation and Weakness Report */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg shadow-inner">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Weakness Report</h3>
                    {dashboardData?.last_weak_topics.length > 0 ? (
                        <p className="text-sm text-gray-900 font-medium">
                            Your next battle should target: <span className="text-red-500 font-extrabold">{dashboardData.last_weak_topics.join(', ')}</span>. Use the "Start Quiz Battle" tab to begin!
                        </p>
                    ) : (
                        <p className="text-sm text-gray-900">No recent weakness data. Excellent work, Trainer! Try a fresh subject in the Quiz Battle tab!</p>
                    )}
                </div>

                <div className="md:col-span-1 flex flex-col justify-center">
                    <button
                        onClick={handlePomodoroToggle}
                        disabled={buttonDisabled}
                        className={`flex items-center justify-center w-full px-4 py-4 font-black rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.05]
                                ${buttonDisabled 
                                    ? (pomodoroStatus === 'breaking' ? 'bg-blue-300 text-blue-900 cursor-not-allowed' : 'bg-gray-400 text-gray-700 cursor-not-allowed')
                                    : 'bg-green-500 text-white hover:bg-green-600 ring-4 ring-green-300/50'
                                }`}
                    >
                        {pomodoroStatus === 'breaking' ? <Heart className="w-5 h-5 mr-2 animate-pulse" /> : <Zap className="w-5 h-5 mr-2" />}
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Component: Quiz Subject Selection (Page 3 Content - RESTORED UI + Access Control) ---
interface QuizSubjectSelectionProps {
    onStartQuiz: (subject: string) => void;
    dashboardData: DashboardData | null;
    // NEW POMODORO PROPS
    pomodoroStatus: 'resting' | 'active' | 'breaking';
    pomodoroTimeLeft: number;
}
const QuizSubjectSelectionScreen: React.FC<QuizSubjectSelectionProps> = ({ onStartQuiz, dashboardData, pomodoroStatus, pomodoroTimeLeft }) => {
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    const weakTopics = dashboardData?.last_weak_topics || [];
    
    // ACCESS CONTROL LOGIC
    const isBreakTime = pomodoroStatus === 'breaking';
    const isResting = pomodoroStatus === 'resting';
    
    const timerMins = Math.floor(pomodoroTimeLeft / 60);
    const timerSecs = pomodoroTimeLeft % 60;
    const timeDisplay = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

    return (
        <div className="p-6 md:p-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border-4 border-red-500/50">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 border-red-500 pb-4">Start a New Quiz Battle</h2>
            
            <p className="text-gray-600 mb-10 font-medium text-lg">
                Choose a field of study to generate a personalized quiz. Must be in an **Active Training Session** to start!
            </p>

            {/* POMODORO BLOCKER MESSAGES */}
            {isBreakTime && (
                <div className="p-4 mb-8 bg-blue-100 border-4 border-blue-500 rounded-xl text-center shadow-lg animate-pulse-slow">
                    <p className="text-2xl font-black text-blue-700 flex items-center justify-center">
                        <Heart className="w-6 h-6 mr-3 text-blue-500 fill-blue-500" /> 
                        POKÉMON RESTING!
                    </p>
                    <p className="text-lg font-bold text-gray-700 mt-2">
                        You must wait **{timeDisplay}** before starting another battle. Time for your 5-minute break!
                    </p>
                </div>
            )}
            
            {isResting && (
                <div className="p-4 mb-8 bg-green-100 border-4 border-green-500 rounded-xl text-center shadow-lg">
                    <p className="text-2xl font-black text-green-700 flex items-center justify-center">
                        <Zap className="w-6 h-6 mr-3 text-green-500 fill-green-500" /> 
                        SESSION REQUIRED!
                    </p>
                    <p className="text-lg font-bold text-gray-700 mt-2">
                        Go to the Dashboard and click **"Start Pomodoro Mode"** to begin your 25-minute training session!
                    </p>
                </div>
            )}
            
            {/* Subject Buttons */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${isBreakTime || isResting ? 'opacity-50 pointer-events-none' : ''}`}>
                {subjects.map(subject => {
                    const isWeak = weakTopics.includes(subject);
                    
                    return (
                        <button
                            key={subject}
                            onClick={() => onStartQuiz(subject)}
                            disabled={isBreakTime || isResting}
                            className={`flex items-center justify-center p-4 bg-red-600 text-white font-bold rounded-xl shadow-lg 
                                         hover:bg-red-700 transition duration-300 transform hover:scale-[1.03] text-center text-lg ring-2 ring-red-400`}
                        >
                            {subject}
                            {isWeak && <Zap className="w-4 h-4 ml-2 text-yellow-300 fill-yellow-300" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


// --- Leaderboard Screen (Page 2) ---
const LeaderboardScreen: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const maxRetries = 3;
            let response = null;
            let data = null;
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/api/leaderboard'); 
                    data = await response.json();
                    
                    if (response.ok) {
                        break; 
                    } else if (i === maxRetries - 1) {
                         throw new Error(data.error || 'Failed to fetch leaderboard data after multiple retries.');
                    }
                } catch (e) {
                     if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
            
            setLeaderboard(data || []); 

        } catch (err: any) {
            console.error("Leaderboard Fetch Error:", err);
            setError(err.message || "An unknown error occurred while fetching the leaderboard.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    if (loading) {
        return (
             <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl shadow-2xl h-96 w-full max-w-4xl mx-auto border-4 border-red-500">
                <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
                <p className="text-gray-900 font-black text-xl">Fetching Top Trainers...</p>
             </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 bg-red-100 border border-red-500 rounded-xl shadow-2xl w-full max-w-4xl mx-auto text-red-800">
                <h3 className="text-xl font-bold text-red-600 mb-3">Leaderboard Error</h3>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }
    
    const getMedal = (rank: number) => {
        if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-lg animate-pulse" />;
        if (rank === 2) return <Trophy className="w-7 h-7 text-gray-400 fill-gray-400 drop-shadow-lg" />;
        if (rank === 3) return <Trophy className="w-6 h-6 text-amber-600 fill-amber-600 drop-shadow-lg" />;
        return <span className="w-6 h-6 text-gray-500 font-black text-lg">{rank}</span>;
    };


    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-white/95 rounded-3xl shadow-[0_0_80px_rgba(255,0,0,0.4)] border-4 border-red-500 backdrop-blur-sm">
            <h2 className="text-4xl font-black text-red-600 mb-8 flex items-center justify-center border-b-4 border-yellow-400 pb-4">
                <Trophy className="w-9 h-9 mr-4 text-yellow-400 fill-yellow-400 drop-shadow-xl" />
                Global Champion Ranking
            </h2>

            <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0"> {/* Restored simpler header */}
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider rounded-tl-xl">Rank</th>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Trainer</th>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Level</th>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider">Total XP</th>
                            <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wider rounded-tr-xl">Partner</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-gray-900">
                        {leaderboard.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 text-center">
                                    No trainers found on the leaderboard. Be the first!
                                </td>
                            </tr>
                        ) : (
                            leaderboard.map((entry, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 hover:bg-yellow-50 transition' : 'bg-white hover:bg-yellow-50 transition'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-gray-900 flex items-center space-x-2">
                                        {getMedal(index + 1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-500">{entry.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{entry.level}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-600 font-black">{entry.xp.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{entry.pokemon_name}</td>
                                
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Component: Login Screen (Pre-Authentication - UNCHANGED) ---
const LoginScreen: React.FC<{ onLoginSuccess: (token: string, userId: string) => void }> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pokemonName, setPokemonName] = useState('Pikachu');
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const endpoint = isRegisterMode ? 'register' : 'login';
        
        try {
            const body = isRegisterMode 
                ? { username, password, pokemon_name: pokemonName } 
                : { username, password };
            
            const maxRetries = 3;
            let response = null;
            let data = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });
                    data = await response.json();

                    if (response.ok && !data.error) {
                        break;
                    } else if (i === maxRetries - 1) {
                        throw new Error(data.error || `${endpoint} failed after multiple retries.`);
                    }
                } catch (e) {
                     if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }


            if (isRegisterMode) {
                setSuccessMessage("Registration successful! Please log in.");
                setIsRegisterMode(false);
            } else {
                onLoginSuccess(data.auth_token, data.user_id);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        // <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-cover bg-center p-4" 
        //      style={{
        //          backgroundImage: "url('/images/bg_login.jpeg')",
        //          // Fallback background color if image fails
        //          backgroundColor: '#1a1a1a'
        //      }}>
        //      {/* Pokémon images for decoration */}
        //      {/* Note: In a real environment, these would need to be base64 or hosted public URLs */}
        //      <img
        //         src="/images/pikachu.png"
        //         alt="Pikachu"
        //         className="absolute w-40 h-40 sm:w-64 sm:h-64 left-[10%] top-[40%] transform -translate-y-1/2 z-0 opacity-100 mix-blend-lighten hidden md:block"
        //         onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display='none'; }}
        //      />
        //      <img
        //         src="/images/charmander.png"
        //         alt="Charmander"
        //         className="absolute w-40 h-40 sm:w-64 sm:h-64 top-[25%] right-[10%] transform -translate-y-1/2 z-0 opacity-100 mix-blend-lighten hidden md:block"
        //         onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display='none'; }}
        //      />

        //     <div className="w-full max-w-sm p-8 rounded-2xl relative z-10
        //         bg-black/50 backdrop-blur-xl
        //         border-4 border-red-500/30
        //         shadow-[0_0_40px_rgba(255,0,0,0.5)]
        //         flex flex-col items-center">
                
        //         <h2 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
        //             Trainer {isRegisterMode ? 'Registration' : 'Login'}
        //         </h2>

        //         {successMessage && (
        //             <div className="p-3 mb-4 bg-green-600/80 text-white rounded-lg font-medium w-full text-center">
        //             {successMessage}
        //             </div>
        //         )}

        //         {/* Username */}
        //         <div className="mb-5 w-full">
        //             <label htmlFor="username-input" className="block text-lg font-semibold text-gray-400 mb-1">Username</label>
        //             <input
        //                 id="username-input"
        //                 type="text"
        //                 placeholder="Trainer Name"
        //                 value={username}
        //                 onChange={(e) => setUsername(e.target.value)}
        //                 className="h-12 w-full text-base px-5 border-none rounded-xl focus:ring-2 focus:ring-red-500
        //                          bg-gray-800 text-white placeholder-gray-500 shadow-inner transition-colors"
        //             />
        //         </div>

        //         {/* Password */}
        //         <div className="mb-6 w-full">
        //             <label htmlFor="password-input" className="block text-lg font-semibold text-gray-400 mb-1">Password</label>
        //             <input
        //                 id="password-input"
        //                 type="password"
        //                 placeholder="Secret Code"
        //                 value={password}
        //                 onChange={(e) => setPassword(e.target.value)}
        //                 className="h-12 w-full text-base px-5 border-none rounded-xl focus:ring-2 focus:ring-red-500
        //                          bg-gray-800 text-white placeholder-gray-500 shadow-inner transition-colors"
        //             />
        //         </div>

        //         {/* Pokémon dropdown (only for register mode) */}
        //         {isRegisterMode && (
        //             <div className="mb-6 w-full">
        //                 <label htmlFor="pokemon-select" className="block text-lg font-semibold text-gray-400 mb-1">Choose Starter Pokémon</label>
        //                 <select
        //                     id="pokemon-select"
        //                     value={pokemonName}
        //                     onChange={(e) => setPokemonName(e.target.value)}
        //                     className="h-12 w-full p-2 bg-gray-800 text-white rounded-xl focus:ring-2 focus:ring-red-500"
        //                 >
        //                     <option value="Pikachu">Pikachu</option>
        //                     <option value="Charmander">Charmander</option>
        //                     <option value="Bulbasaur">Bulbasaur</option>
        //                     <option value="Squirtle">Squirtle</option>
        //                     <option value="Turtwig">Turtwig</option>
        //                 </select>
        //             </div>
        //         )}

        //         {error && (
        //             <div className="p-3 mb-4 bg-red-700/80 text-white rounded-lg font-medium w-full text-center">
        //             {error}
        //             </div>
        //         )}

        //         {/* Login/Register Button */}
        //         <button
        //             onClick={handleSubmit}
        //             disabled={loading || !username || !password || (isRegisterMode && !pokemonName)}
        //             className="w-full py-3 mt-2 font-extrabold text-lg rounded-xl shadow-lg transition-all duration-300
        //                     bg-gradient-to-r from-red-600 to-red-400
        //                     hover:from-red-700 hover:to-red-500
        //                     text-white disabled:bg-gray-500 disabled:from-gray-500 disabled:to-gray-400 disabled:cursor-not-allowed"
        //         >
        //             {loading ? (
        //             <Loader2 className="w-5 h-5 inline animate-spin text-white" />
        //             ) : (
        //             isRegisterMode ? 'Register New Trainer' : 'Login'
        //             )}
        //         </button>

        //         {/* Switch mode link */}
        //         <p className="mt-6 text-center text-sm text-gray-300">
        //             {isRegisterMode ? 'Already registered?' : "New to PokeQuest?"}
        //             <button
        //                 onClick={() => {
        //                     setIsRegisterMode(!isRegisterMode);
        //                     setError('');
        //                     setSuccessMessage('');
        //                 }}
        //                 className="text-yellow-400 hover:text-yellow-300 font-semibold ml-2 transition"
        //             >
        //                 {isRegisterMode ? 'Log in' : 'Register now'}
        //             </button>
        //         </p>
        //     </div>
        // </div>
        

        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-cover bg-center p-4" style={{ backgroundImage: "url('/images/bg_login.jpeg')" }}>
                {/* Pikachu */}
                <img
                src="/images/pikachu .png"
                alt="Pikachu"
                className="absolute w-64 h-64 sm:w-80 sm:h-78 left-[23%] top-[47%] transform -translate-y-1/2 z-0 opacity-100 mix-blend-normal"
                />

                {/* Bulbasaur */}
                <img
                src="/images/bulbasaur.png"
                alt="Bulbasaur"
                className="absolute w-48 h-48 sm:w-80 sm:h-75 top-[2%] left-[37%] transform -translate-x-1/2 z-0 opacity-100 mix-blend-normal"
                />

                {/* Charmander */}
                <img
                src="/images/charmandar.png"
                alt="Charmander"
                className="absolute w-56 h-56 sm:w-80 sm:h-75 top-[30%] right-[27%] transform -translate-y-1/2 z-0 opacity-100 mix-blend-normal"
                />

                {/* Squirtle */}
                <img
                src="/images/squirtle.png"
                alt="Squirtle"
                className="absolute w-56 h-56 sm:w-88 sm:h-90 bottom-[25%] right-[20%] transform z-0 opacity-100 mix-blend-normal"
                />

            

            <div className="w-full max-w-sm p-8 rounded-2xl relative z-10
             bg-black/40 backdrop-blur-xl
             border border-[#00FFD1]/10
             shadow-[0_0_30px_rgba(0,255,209,0.4)]
             ring-2 ring-[#00FFD1]/40
             flex flex-col items-center">
        <h2 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
            Trainer {isRegisterMode ? 'Registration' : 'Login'}
        </h2>

        {successMessage && (
            <div className="p-3 mb-4 bg-green-600/80 text-white rounded-lg font-medium w-full text-center">
            {successMessage}
            </div>
        )}

       
                <div className="mb-5">
                    <label htmlFor="username-input" className="block text-lg font-semibold text-gray-400 mb-1">
                        Username
                    </label>
                    <input
                        id="username-input"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-14 w-full text-base px-5 pr-12
                                border-none rounded-xl
                                focus:ring-2 focus:ring-[#00FFD1]
                                bg-[#151C20] text-white placeholder-gray-500
                                shadow-inner shadow-gray-700/50 transition-colors"
                    />
                </div>

                {/* Password */}
                <div className="mb-6">
                    <label htmlFor="password-input" className="block text-lg font-semibold text-gray-400 mb-1">
                        Password
                    </label>
                    <input
                        id="password-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 w-full text-base px-5 pr-12
                                border-none rounded-xl
                                focus:ring-2 focus:ring-[#00FFD1]
                                bg-[#151C20] text-white placeholder-gray-500
                                shadow-inner shadow-gray-700/50 transition-colors"
                    />
                </div>

        {/* Pokémon dropdown (only for register mode) */}
        {isRegisterMode && (
            <select
            value={pokemonName}
            onChange={(e) => setPokemonName(e.target.value)}
            className="w-full p-3 mb-6 border border-gray-500 bg-black/60 text-white rounded-lg
                        focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            >
            <option value="Pikachu">Pikachu</option>
            <option value="Charmander">Charmander</option>
            <option value="Bulbasaur">Bulbasaur</option>
            <option value="Squirtle">Squirtle</option>
            <option value="Turtwig">Turtwig</option>
            </select>
        )}

        {error && (
            <div className="p-3 mb-4 bg-red-700/80 text-white rounded-lg font-medium w-full text-center">
            {error}
            </div>
        )}

        {/* Login/Register Button */}
        <button
            onClick={handleSubmit}
            disabled={loading || !username || !password || (isRegisterMode && !pokemonName)}
            className="w-full py-3 mt-2 font-extrabold rounded-lg shadow-lg transition-all duration-300
                    bg-gradient-to-t from-orange-500 to-yellow-400
                    hover:from-orange-600 hover:to-yellow-300
                    text-black disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
            {loading ? (
            <Loader2 className="w-5 h-5 inline animate-spin text-black" />
            ) : (
            isRegisterMode ? 'Register' : 'Login'
            )}
        </button>

        {/* Switch mode link */}
        <p className="mt-6 text-center text-sm text-gray-300">
            {isRegisterMode ? 'Already have an account?' : "Don’t have an account?"}
            <button
            onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
                setSuccessMessage('');
            }}
            className="text-red-400 hover:text-red-300 font-semibold ml-2 transition"
            >
            {isRegisterMode ? 'Login here' : 'Register here'}
            </button>
        </p>
        </div>
    </div>


    );
};


const LandingScreen: React.FC<{ onStartJourney: () => void }> = ({ onStartJourney }) => {
    
const WelcomeScreen: React.FC<{ onGoToLogin: () => void }> = ({ onGoToLogin }) => {
    const pokemonName = "Pikachu";
    return (

            <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 relative">
            {/* Dark Overlay for contrast */}
            <div className="absolute inset-0 bg-black/70"></div>
            
            {/* MODIFIED: Adjusted max-w and gap for larger image */}
            <div className="z-10 max-w-7xl w-full flex flex-col md:flex-row items-center justify-between lg:gap-16">
                
                {/* Left: Text and Buttons */}
                <div className="text-left space-y-6 md:w-1/2 p-4">
                    <h1 className="text-6xl font-extrabold leading-tight">
                        Begin Your Adventure!
                    </h1>
                    <p className="text-xl text-gray-300">
                        Immerse yourself in the captivating world of Pokémon. Choose your starter, witness its hatch, and embark on a personalized learning experience that will elevate your knowledge and skills. Unlock the secrets of these beloved creatures
                    </p>

                    <div className="pt-6 space-y-4">
                        {/* 🛑 Single "Let's Begin" Button linked to Login (onGoToLogin) 🛑 */}
                        <button
                            onClick={onGoToLogin} 
                            className="flex items-center justify-center px-10 py-4 w-64 bg-[#FFEA00] text-black font-extrabold text-lg rounded-xl shadow-xl shadow-yellow-500/50
                                       transition duration-200 transform hover:scale-[1.03] ring-2 ring-[#FFEA00]"
                        >
                            <Zap className="w-5 h-5 mr-2" /> Let's Begin!
                        </button>
                    </div>
                </div>

                {/* Right: 3D Aesthetic Image Placeholder */}
                {/* 🛑 MODIFIED: Adjusted width classes for the image and its container 🛑 */}
                <div className="md:w-1/2 flex justify-center p-4 overflow-visible relative">
                    <img 
                        src='/images/pikachu_landing_03.png'
                        alt="3D Pokémon Starter Scene"
                        // 🛑 NEW CLASSES: Made image take up more width and shifted it right 🛑
                        className="w-[180%] max-w-none md:w-[130%] lg:w-[150%] xl:w-[180%] 2xl:w-[200%]
                                   drop-shadow-[0_0_40px_rgba(255,234,0,0.7)] 
                                   translate-x-[15%] md:translate-x-[25%] lg:translate-x-[30%] xl:translate-x-[20%] 
                                   -translate-y-[10%] md:-translate-y-[5%]" // Slightly lift to center vertically
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src='https://placehold.co/400x400/101010/FFEA00?text=3D+Scene'; }}
                    />
                </div>
            </div>
        </div>


    );
};


const FeatureRow: React.FC = () => {
    // 1. Define the features with Pikachu added
    const features = [
        { 
            name: "Pikachu", 
            image: "/images/pikachu_starter.png", // Assuming you have a starter image for Pikachu
            color: "bg-yellow-500", // Bright yellow for Pikachu's container
            description: "The iconic \"Electric Pokémon.\" Choosing Pikachu channels boundless energy and lightning-fast critical thinking. It is the perfect partner for trainers seeking electric efficiency and impactful, dynamic solutions." 
        },
        { 
            name: "Bulbasaur", 
            image: "/images/bulbasaur_starter.png", 
            color: "bg-[#2563EB]", 
            description: "The original \"Bulb Pokémon.\" Choosing Bulbasaur means embracing the power of balanced learning and strategic growth. It's the steadfast companion for trainers who value a solid foundation, ready to bloom into comprehensive expertise." 
        },
        { 
            name: "Squirtle", 
            image: "/images/squirtle_starter.png", 
            color: "bg-[#10B981]", 
            description: "The original \"Tiny Turtle Pokémon.\" Squirtle is the perfect choice for trainers focused on analytical thinking and precise execution. Choose Squirtle to master the art of controlled research and emerge victorious through pure reason." 
        },
        { 
            name: "Charmander", 
            image: "/images/charmander_starter.png", 
            color: "bg-[#F59E0B]", 
            description: "The original \"Lizard Pokémon.\" Choosing Charmander ignites your journey with passion and speed. Its tail flame reflects your unquenchable thirst for knowledge, mirroring your own limitless academic ambition." 
        },
    ];

    return (
        <section className="py-20 bg-black text-white px-4">
            <div className="max-w-6xl mx-auto text-center">
                
                {/* Headers */}
                <p className="text-yellow-400 font-semibold mb-2 text-3xl">Discover the Wonders of Pokémon</p>
                <h3 className="text-6xl font-extrabold mb-6">Explore the Pokémon World</h3>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-12">
                    Join us on a captivating Pokémon journey where you'll choose a starter Pokémon, watch it hatch from an egg, 
                    and train to become a master.
                </p>

                {/* Feature Cards Grid: CHANGED to grid-cols-4 for desktop (lg:), but kept md:grid-cols-3 for medium screens if needed, and cols-1 for mobile. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature) => {
                        // Dynamically determine the Tailwind gradient classes
                        let titleClasses = "text-2xl font-bold mb-2 ";

                        if (feature.name === 'Pikachu') {
                            // Electric Yellow Gradient for Pikachu ⚡
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-500';
                        } else if (feature.name === 'Bulbasaur') {
                            // Enhanced Green Gradient
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-emerald-600';
                        } else if (feature.name === 'Squirtle') {
                            // Enhanced Blue Gradient
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-600';
                        } else if (feature.name === 'Charmander') {
                            // Reddish Orange Gradient
                            titleClasses += 'bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600';
                        } else {
                            // Default fallback
                            titleClasses += 'text-white';
                        }

                        return (
                            <div 
                                key={feature.name} 
                                className="bg-gray-800/50 rounded-2xl p-6 shadow-2xl transition transform hover:scale-[1.03] duration-300 border border-gray-700 hover:border-yellow-400"
                            >
                                {/* Circular Image Container */}
                                <div className="flex justify-center mb-6">
                                    <div className={`w-40 h-40 flex items-center justify-center rounded-full p-2 ${feature.color} shadow-inner shadow-black/20 overflow-hidden`}>
                                        <img
                                            src={feature.image}
                                            alt={feature.name}
                                            className="w-full h-full object-cover drop-shadow-lg scale-175 transform -translate-y-2" 
                                            onError={(e) => { e.currentTarget.src = `https://placehold.co/160x160/${feature.color.replace('bg-[#','').replace(']','')}/white?text=${feature.name}`; }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Apply the dynamic gradient class to the title */}
                                <h4 className={titleClasses}>
                                    {feature.name}
                                </h4>
                                
                                <p className="text-gray-400 text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}



    return (
        <div className="flex flex-col min-h-screen bg-black relative overflow-hidden font-inter">
            {/* Header/Nav for Landing Page */}
            <nav className="relative z-20 w-full p-6 flex justify-between items-center bg-black/50 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-white text-3xl font-bold">
                    <Egg className="w-7 h-7 text-yellow-300 fill-yellow-300" />
                    <span className="text-yellow-300">Poke</span><span className="text-white">Quest</span>
                </div>
                {/* Desktop Menu */}
                <div className="hidden sm:flex items-center space-x-6">
                    <button onClick={onStartJourney} className="px-5 py-2 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition shadow-xl">
                        Start Journey
                    </button>
                </div>
                {/* Mobile Login Button */}
                <button onClick={onStartJourney} className="sm:hidden px-3 py-1 bg-red-500 text-white font-bold rounded-full">
                    Login
                </button>
            </nav>

            {/* Hero Section */}
            <header className="flex flex-col md:flex-row relative overflow-hidden min-h-[calc(100vh-80px)] bg-black">
                {/* Background Image Container */}
                <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
                    <img
                        src='/images/hero_pikachu.png'
                        alt="A stylized illustration of Pikachu welcoming users."
                        className="object-contain w-full h-full md:w-[60vw] md:h-full lg:w-[50vw] xl:w-[45vw]
                                 md:absolute md:right-0 md:bottom-0 md:translate-x-[15%] md:translate-y-[15%]
                                 lg:translate-x-[10%] lg:translate-y-[10%] xl:translate-x-[0%] xl:translate-y-[10%]
                                 mix-blend-lighten opacity-30 sm:opacity-90"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src='https://placehold.co/800x800/000000/F5D04C?text=Pikachu+Placeholder'; }}
                    />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-center items-center md:items-start w-full md:w-1/2 mr-auto p-8 lg:p-16 text-center md:text-left">
                    <h2 className="text-6xl lg:text-7xl font-black text-white leading-tight mb-4 tracking-tighter drop-shadow-lg">
                        Train Smarter, <br className="hidden md:inline"/> Become a Master.
                    </h2>
                    
                    {/* Tagline/Description */}
                    <p className="text-lg text-gray-300 mb-10 max-w-lg mx-auto md:mx-0">
                        Welcome to PokeQuest! Every lesson is a new challenge. Choose your research topic, hatch a brilliant insight, and begin your quest to discover your potential and become an expert trainer.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center md:justify-start">
                        <button
                            onClick={onStartJourney}
                            className="flex items-center justify-center bg-yellow-300 text-white font-bold py-4 px-8 rounded-xl shadow-2xl
                                     hover:bg-yellow-300 transition duration-300 text-lg transform hover:scale-[1.05] ring-2 ring-red-300/50"
                        >
                            <Zap className="w-5 h-5 mr-2" /> Start Your Quest
                        </button>
                        
                        <a href="#features" className="flex items-center justify-center border-2 border-gray-500 text-gray-300 font-bold py-4 px-8 rounded-xl
                                     hover:border-yellow-300 hover:text-yellow-300 transition duration-300 text-lg">
                            <BookOpen className="w-5 h-5 mr-2" /> Explore Features
                        </a>
                    </div>
                </div>
            </header>
            
            {/* Feature Row (Placed after the Hero Section) */}
            <div id="features" className="bg-gray-900">
                <FeatureRow />
                <WelcomeScreen />
            </div>
        </div>
        
  
    );
};



// --- Component: MainLayout (Wrapper - RESTORED UI + Pomodoro) ---
type LoggedInScreen = 'dashboard' | 'leaderboard' | 'quiz_select' | 'quiz_battle';

interface MainLayoutProps {
    dashboardData: DashboardData | null;
    loadingDashboard: boolean;
    fetchDashboardData: () => void;
    logout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ dashboardData, loadingDashboard, fetchDashboardData, logout }) => {
    // Initial state set to 'dashboard'
    const [currentScreen, setCurrentScreen] = useState<LoggedInScreen>('dashboard');
    const [currentSubject, setCurrentSubject] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // --- POMODORO STATES AND CONSTANTS ---
    const POMODORO_WORK_DURATION = 25 * 60; // 25 mins in seconds
    const POMODORO_BREAK_DURATION = 5 * 60; // 5 mins in seconds

    const [pomodoroStatus, setPomodoroStatus] = useState<'resting' | 'active' | 'breaking'>('resting');
    const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(POMODORO_WORK_DURATION);
    const [isPomodoroActive, setIsPomodoroActive] = useState(false);
    // --- END POMODORO STATES ---

    // --- POMODORO TIMER EFFECT ---
    useEffect(() => {
        // Only tick the timer if Pomodoro is active AND the user is viewing a quiz screen
        const isQuizScreen = currentScreen === 'quiz_select' || currentScreen === 'quiz_battle';

        // Timer runs only if Pomodoro is active, OR if it's currently on break (so break completes regardless of screen)
        // Correction: User requested fatigue only decreases when on QUIZ page. Break timer should run regardless to ensure mandatory break.
        const shouldTimerRun = isPomodoroActive && (isQuizScreen || pomodoroStatus === 'breaking');

        if (!shouldTimerRun) return;

        const timer = setInterval(() => {
            setPomodoroTimeLeft(prevTime => {
                if (prevTime > 0) {
                    return prevTime - 1;
                } else {
                    // Time expired
                    if (pomodoroStatus === 'active') {
                        // Transition to break
                        setPomodoroStatus('breaking');
                        return POMODORO_BREAK_DURATION;
                    } else if (pomodoroStatus === 'breaking') {
                        // Transition back to resting
                        setPomodoroStatus('resting');
                        setIsPomodoroActive(false); // Stop the entire mode
                        return POMODORO_WORK_DURATION;
                    }
                    return 0;
                }
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPomodoroActive, pomodoroStatus, currentScreen]); // Dependency on currentScreen is crucial for pausing WORK timer

    const handlePomodoroToggle = () => {
        if (pomodoroStatus === 'resting') {
            setPomodoroStatus('active');
            setPomodoroTimeLeft(POMODORO_WORK_DURATION);
            setIsPomodoroActive(true);
        }
        // Button is disabled during 'active' and 'breaking' states
    };

    // Handlers
    const handleStartQuiz = (subject: string) => {
        // Prevent starting quiz if not in 'active' pomodoro
        if (pomodoroStatus !== 'active') {
            console.warn("Quiz access blocked: Not in an active Pomodoro session.");
            return;
        }

        setCurrentSubject(subject);
        setCurrentScreen('quiz_battle'); // Navigate to the active quiz battle
        setIsSidebarOpen(false); 
    };

    const handleQuizComplete = (data: { score: number; weak_topics: string[] }) => {
        console.log("Quiz completed and results submitted. Updating dashboard stats.");
        fetchDashboardData(); 
        setCurrentScreen('dashboard'); // Return to dashboard after completion
    };
    
    const handleExitQuiz = () => {
        setCurrentScreen('quiz_select'); // If user exits quiz mid-way, return to subject selection
    };
    
    const handleViewLeaderboard = () => {
        setCurrentScreen('leaderboard');
        setIsSidebarOpen(false); 
    }
    
    const navigate = (screen: LoggedInScreen) => {
        setCurrentScreen(screen);
        setIsSidebarOpen(false); 
    }

    // Nav Items
    const navItems = [
        { name: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard },
        { name: 'Leaderboard', screen: 'leaderboard', icon: Trophy },
        // Updated to target the dedicated subject selection screen
        { name: 'Start Quiz Battle', screen: 'quiz_select', icon: Zap }, 
    ];
    
    // Render Screen Content
    let screenContent;
    switch (currentScreen) {
        case 'dashboard':
            screenContent = loadingDashboard ? (
                <div className="flex flex-col items-center justify-center p-10 bg-white rounded-3xl shadow-2xl h-96 w-full max-w-4xl mx-auto border-4 border-red-500">
                    <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
                    <p className="text-gray-900 font-black text-xl">Loading Trainer Data...</p>
                </div>
            ) : (
                // Dashboard now receives Pomodoro state
                <Dashboard 
                    onStartQuiz={handleStartQuiz} 
                    dashboardData={dashboardData} 
                    onViewLeaderboard={() => navigate('leaderboard')}
                    pomodoroStatus={pomodoroStatus}
                    pomodoroTimeLeft={pomodoroTimeLeft}
                    handlePomodoroToggle={handlePomodoroToggle}
                />
            );
            break;
        case 'leaderboard':
            screenContent = <LeaderboardScreen />;
            break;
        case 'quiz_select':
            screenContent = (
                // Quiz Subject Selection receives Pomodoro state
                <QuizSubjectSelectionScreen 
                    onStartQuiz={handleStartQuiz}
                    dashboardData={dashboardData}
                    pomodoroStatus={pomodoroStatus}
                    pomodoroTimeLeft={pomodoroTimeLeft}
                />
            );
            break;
        case 'quiz_battle':
            screenContent = (
                // Active quiz session
                <QuizBattle 
                    subject={currentSubject} 
                    onQuizComplete={handleQuizComplete} 
                    onExit={handleExitQuiz} 
                />
            );
            break;
        default:
            screenContent = <p className="text-gray-900">Select a navigation link.</p>;
    }

    return (
        // Restored simple white/red theme structure
        <div className="flex min-h-screen bg-gray-50 font-inter">
            {/* Sidebar (Desktop) and Mobile Menu - Restored Simpler Theme */}
            <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                                lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out 
                                w-72 bg-white shadow-xl border-r-4 border-red-500 z-30 flex flex-col`}>
                
                {/* Logo and Close Button */}
                <div className="p-6 flex items-center justify-between border-b border-gray-200 h-24">
                    <div className="flex items-center space-x-2 text-3xl font-black">
                        <Egg className="w-7 h-7 text-red-500 fill-red-500" />
                        <span className="text-red-500">Poke</span><span className="text-gray-900">Quest</span>
                    </div>
                    <button 
                        className="lg:hidden text-gray-500 hover:text-red-500 p-2 rounded-full bg-gray-100"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-grow p-6 space-y-3">
                    {navItems.map(item => (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.screen as LoggedInScreen)} 
                            className={`flex items-center w-full px-5 py-3 rounded-lg font-bold transition-all duration-300 
                                ${currentScreen === item.screen || (item.screen === 'quiz_select' && currentScreen === 'quiz_battle') 
                                    ? 'bg-red-500 text-white shadow-lg transform scale-[1.02] border border-red-700'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-red-500'
                                }`}
                        >
                            <item.icon className="w-6 h-6 mr-3" />
                            {item.name}
                        </button>
                    ))}
                </nav>

                {/* Footer/Logout */}
                <div className="p-6 border-t border-gray-200">
                    <p className="text-base font-semibold text-gray-500 mb-1 truncate">
                        Trainer: {dashboardData?.trainer_card.username || 'Loading...'}
                    </p>
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 mt-2 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition shadow-lg"
                    >
                        <XCircle className="w-5 h-5 mr-2" /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 relative">
                {/* Mobile Header for Menu Button */}
                <header className="flex justify-between items-center lg:hidden sticky top-0 bg-white/95 backdrop-blur-md z-20 py-4 mb-4 rounded-b-xl border-b border-red-500/50 shadow-md">
                     <div className="flex items-center space-x-2 text-2xl font-bold">
                        <Egg className="w-6 h-6 text-red-500 fill-red-500" />
                        <span className="text-red-500">Poke</span><span className="text-gray-900">Quest</span>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-red-500 text-white rounded-xl shadow-xl hover:bg-red-600 transition"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>
                
                {/* Conditional Content Render (z-10 ensures it's above the floating BG elements) */}
                <div className="relative z-10">
                    {screenContent}
                </div>
            </div>
        </div>
    );
};


// --- Custom Keyframe CSS for animation (included directly in JSX via style/tailwind classes) ---
const styleTag = document.createElement('style');
styleTag.innerHTML = `
    @keyframes pulse-slow {
        0%, 100% { transform: scale(1.0) translateX(0px); opacity: 1; }
        50% { transform: scale(1.03) translateX(2px); opacity: 0.95; }
    }
    .animate-pulse-slow {
        animation: pulse-slow 5s infinite ease-in-out;
    }
    @keyframes float-slow {
        0%, 100% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-10px) translateX(10px); }
    }
    .animate-float-slow {
        animation: float-slow 15s infinite ease-in-out;
    }
    @keyframes float-medium {
        0%, 100% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(8px) translateX(-5px); }
    }
    .animate-float-medium {
        animation: float-medium 10s infinite ease-in-out;
    }
    @keyframes float-fast {
        0%, 100% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-5px) translateX(5px); }
    }
    .animate-float-fast {
        animation: float-fast 7s infinite ease-in-out;
    }
`;
document.head.appendChild(styleTag);


// --- Component: App (State Management & Global Wrapper) ---
type Screen = 'landing' | 'login' | 'main'; 

const App: React.FC = () => {
    const { isLoggedIn, login, logout, token } = useAuth();
    
    // Determine initial screen based on auth state
    const initialScreen = isLoggedIn ? 'main' : 'landing';
    const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);
    
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    
    // Ensures state sync on login/logout
    useEffect(() => {
        if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'landing')) {
            setCurrentScreen('main');
        } else if (!isLoggedIn && currentScreen === 'main') {
            setCurrentScreen('landing');
        }
    }, [isLoggedIn, currentScreen]);

    const fetchDashboardData = useCallback(async () => {
        if (!token) return;

        setLoadingDashboard(true);
        try {
            const maxRetries = 3;
            let response = null;
            let data = null;
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/api/dashboard', {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    data = await response.json();
                    
                    if (response.ok && !data.error) {
                        break; 
                    } else if (i === maxRetries - 1) {
                         throw new Error(data.error || 'Failed to fetch dashboard data after multiple retries.');
                    }
                } catch (e) {
                     if (i === maxRetries - 1) {
                        throw new Error(`Failed to connect to server after ${maxRetries} attempts.`);
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }

            setDashboardData(data);
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoadingDashboard(false);
        }
    }, [token]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchDashboardData();
        }
    }, [isLoggedIn, fetchDashboardData]);

    // Handlers
    const handleStartJourney = () => {
        setCurrentScreen('login');
    };

    const handleLoginSuccess = (authToken: string, userId: string) => {
        login(authToken, userId);
        setCurrentScreen('main');
    };

    // --- Render Current Screen ---
    const renderScreen = () => {
        if (currentScreen === 'landing') {
            return <LandingScreen onStartJourney={handleStartJourney} />;
        }
        
        if (currentScreen === 'login') {
            return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
        }
        
        if (currentScreen === 'main' && isLoggedIn) {
            return (
                <MainLayout
                    dashboardData={dashboardData}
                    loadingDashboard={loadingDashboard}
                    fetchDashboardData={fetchDashboardData}
                    logout={logout}
                />
            );
        }
        
        // Fallback or while redirecting
        return (
             <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
        );
    };

    return (
        <div className="font-inter">
            {renderScreen()}
        </div>
    );
};

export default App;
