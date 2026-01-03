import React from 'react';
import { UserState, Quest, Market } from '../types';
import { Rocket, Target, CheckCircle2, Circle, ShieldCheck } from 'lucide-react';
import { Vector3 } from 'three';
import { MiniMap } from './MiniMap';

interface HUDProps {
  userState: UserState;
  quests: Quest[];
  shipPosition: Vector3;
  markets: Market[];
}

export const HUD: React.FC<HUDProps> = ({ userState, quests, shipPosition, markets }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-start w-full">
          
          {/* LEFT: Profile Card */}
          <div className="pointer-events-auto flex items-start gap-4 animate-in slide-in-from-left duration-500">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-br-2xl p-4 md:pr-10 shadow-lg relative overflow-hidden group">
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-[2px] h-full bg-cosmos-cyan/50 animate-pulse"></div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cosmos-cyan/20 to-cosmos-purple/20 border border-white/10 flex items-center justify-center">
                            <Rocket className="text-white w-6 h-6" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center border border-cosmos-green">
                            <div className="w-2 h-2 bg-cosmos-green rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="font-orbitron font-bold text-white text-xs tracking-[0.2em] text-opacity-80">COMMANDER</h2>
                        <div className="text-cosmos-cyan text-lg font-rajdhani font-bold uppercase leading-none">{userState.title}</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">LVL {userState.level} <span className="text-white/20 mx-1">|</span> {userState.points} XP</div>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-cosmos-cyan to-cosmos-purple h-full shadow-[0_0_10px_#00f0ff]" 
                        style={{ width: `${(userState.points % 500) / 5}%` }}
                    ></div>
                </div>
              </div>
          </div>

          {/* RIGHT: Quest Log */}
          <div className="pointer-events-auto animate-in slide-in-from-right duration-500 delay-100">
             <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-bl-2xl p-4 w-64 md:w-80 shadow-lg">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                        <Target className="text-cosmos-purple w-4 h-4" />
                        <h3 className="font-orbitron text-xs font-bold text-white tracking-widest">MISSIONS</h3>
                    </div>
                    <span className="text-[10px] bg-cosmos-purple/20 text-cosmos-purple px-1.5 rounded font-mono">
                        {quests.filter(q => q.completed).length}/{quests.length}
                    </span>
                </div>
                
                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                    {quests.map(quest => (
                    <div 
                        key={quest.id} 
                        className={`p-3 rounded-lg border transition-all duration-300 ${
                            quest.completed 
                            ? 'bg-cosmos-green/5 border-cosmos-green/20' 
                            : 'bg-white/5 border-transparent hover:border-white/10'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm font-bold font-rajdhani ${quest.completed ? 'text-cosmos-green line-through opacity-70' : 'text-gray-100'}`}>
                                {quest.title}
                            </span>
                            {quest.completed ? 
                                <ShieldCheck className="w-4 h-4 text-cosmos-green" /> : 
                                <Circle className="w-3 h-3 text-gray-600 mt-1" />
                            }
                        </div>
                        
                        {!quest.completed && (
                            <>
                                <p className="text-[11px] text-gray-400 mb-2 leading-tight">{quest.description}</p>
                                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-cosmos-purple h-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="text-[9px] text-right text-gray-500 mt-1 font-mono">
                                    {quest.progress} / {quest.target}
                                </div>
                            </>
                        )}
                    </div>
                    ))}
                </div>
             </div>
          </div>
      </div>

      {/* FOOTER AREA */}
      <div className="flex justify-between items-end w-full mt-auto">
          {/* Empty left corner (reserved for chat or logs later) */}
          <div className="hidden md:block w-64"></div>

          {/* RIGHT: Radar */}
          <div className="pointer-events-auto animate-in slide-in-from-bottom duration-700 delay-200">
             <MiniMap shipPosition={shipPosition} markets={markets} />
          </div>
      </div>
    </div>
  );
};