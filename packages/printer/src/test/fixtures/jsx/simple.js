import React from "react";
import Component from './Component';

export function App() {
  return (
    <div>
      <Component className={`test`} somethingElse="test" boolean={true} />
    </div>
  );
}
