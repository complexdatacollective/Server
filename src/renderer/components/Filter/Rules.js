import React from 'react';
import { SortableContainer } from 'react-sortable-hoc';
import { TransitionGroup } from 'react-transition-group';
import AppearTransition from '@codaco/ui/lib/components/Transitions/Appear';
import Rule from './Rule';

const Rules = SortableContainer(
  ({
    rules, onUpdateRule, onDeleteRule, codebook,
  }) => (
    <TransitionGroup className="rules">
      {rules.map((rule, index) => (
        <AppearTransition
          key={`rule-${rule.id}`}
        >
          <Rule
            {...rule}
            index={index}
            sortIndex={index}
            onUpdateRule={onUpdateRule}
            onDeleteRule={onDeleteRule}
            className="rules__rule"
            codebook={codebook}
          />
        </AppearTransition>
      ))}
    </TransitionGroup>
  ),
);

export default Rules;
