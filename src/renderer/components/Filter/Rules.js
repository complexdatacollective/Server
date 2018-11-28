import React from 'react';
import { SortableContainer } from 'react-sortable-hoc';
// import { TransitionGroup } from 'react-transition-group';
import Rule from './Rule';
// import AppearTransition from '../Transitions/Appear';

const Rules = SortableContainer(
  ({ rules, onUpdateRule, onDeleteRule, variableRegistry }) => (
    <div className="rules">
      {/* <TransitionGroup className="rules"> */}
      {rules.map((rule, index) => (
        // <AppearTransition
        //   key={`rule-${rule.id}`}
        // >
        <Rule
          {...rule}
          key={`rule-${rule.id}`}
          index={index}
          sortIndex={index}
          onUpdateRule={onUpdateRule}
          onDeleteRule={onDeleteRule}
          className="rules__rule"
          variableRegistry={variableRegistry}
        />
        // </AppearTransition>
      ))}
      {/* </TransitionGroup> */}
    </div>
  ),
);

export default Rules;
