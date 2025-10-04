import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const InfoCard = ({ title, description, content, footer, className }) => {
  return (
    <Card className={`absolute top-67 right-4 z-10 w-80 bg-slate-800/90 backdrop-blur-md border-slate-700/50 shadow-2xl ${className || ''}`}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-slate-100 text-lg">{title}</CardTitle>}
          {description && <CardDescription className="text-slate-400">{description}</CardDescription>}
        </CardHeader>
      )}
      {content && (
        <CardContent className="text-slate-200">
          {content}
        </CardContent>
      )}
      {footer && (
        <CardFooter className="text-slate-400">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};

export default InfoCard;
