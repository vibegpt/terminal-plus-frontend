import React, { ReactNode } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { useLocation } from "wouter";

interface TransitionManagerProps {
  children: ReactNode;
}

export default function TransitionManager({ children }: TransitionManagerProps) {
  const [location] = useLocation();

  return (
    <TransitionGroup>
      <CSSTransition
        key={location}
        classNames="fade"
        timeout={300}
      >
        {children}
      </CSSTransition>
    </TransitionGroup>
  );
}