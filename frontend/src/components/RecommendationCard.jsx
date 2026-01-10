import React from 'react';
import {
    CigaretteOff, Apple, Footprints, Wine, Moon,
    Brain, Scale, Stethoscope, Droplet, CalendarCheck, Lightbulb
} from 'lucide-react';

const ICON_MAP = {
    'cigarette-off': CigaretteOff,
    'apple': Apple,
    'footprints': Footprints,
    'wine-off': Wine,
    'moon': Moon,
    'brain': Brain,
    'scale': Scale,
    'stethoscope': Stethoscope,
    'droplet': Droplet,
    'calendar-check': CalendarCheck,
};

function RecommendationCard({ recommendation }) {
    const IconComponent = ICON_MAP[recommendation.icon] || Lightbulb;

    return (
        <div className="recommendation-card">
            <div className="recommendation-card__icon">
                <IconComponent size={20} color="white" />
            </div>
            <div className="recommendation-card__content">
                <div className="recommendation-card__title">{recommendation.primary}</div>
                {recommendation.details && (
                    <div className="recommendation-card__details">{recommendation.details}</div>
                )}
            </div>
        </div>
    );
}

export default RecommendationCard;
