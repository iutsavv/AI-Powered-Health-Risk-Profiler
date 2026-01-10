import React, { useEffect, useState } from 'react';

function RiskMeter({ score, riskLevel }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const [needleAngle, setNeedleAngle] = useState(-90);

    useEffect(() => {
        // Animate score counting up
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedScore(Math.round(score * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);

        // Animate needle
        // Score 0 = -90deg, Score 100 = 90deg
        const targetAngle = -90 + (score / 100) * 180;
        setTimeout(() => {
            setNeedleAngle(targetAngle);
        }, 100);
    }, [score]);

    const getRiskClass = () => {
        if (riskLevel === 'very high') return 'very-high';
        return riskLevel;
    };

    return (
        <div className="risk-meter">
            <div className="risk-meter__gauge">
                <div className="risk-meter__arc">
                    <div
                        className="risk-meter__needle"
                        style={{ transform: `translateX(-50%) rotate(${needleAngle}deg)` }}
                    />
                </div>
            </div>

            <div className={`risk-meter__score ${getRiskClass()}`}>
                {animatedScore}
            </div>

            <div className={`risk-meter__level ${getRiskClass()}`}>
                {riskLevel} Risk
            </div>
        </div>
    );
}

export default RiskMeter;
