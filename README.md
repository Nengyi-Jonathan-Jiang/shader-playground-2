# Shader Playground

A browser-based OpenGL fragment shader explorer inspired by [ShaderToy](https://www.shadertoy.com/), 
built with React.js and WebGL2. 

Focused on real-time shader iteration and building custom UI and rendering infrastructure from scratch.

Live demo: https://njonathanj.com/shader-playground-2/

## Features

- Custom shader uniforms
    - Define inputs using JavaScript for more complex and interactive shaders
- Syntax highlighting for GLSL and JavaScript
- Resizable UI layout
- Tabbed uniform editor

## Running locally

Requirements:
- Node.js
- a package manager, like `npm` or `yarn`
```
git clone https://github.com/Nengyi-Jonathan-Jiang/shader-playground-2
cd shader-playground-2
yarn install
yarn build
yarn start
```
Then open http://localhost:3000

## Design Decisions

- **Tokenization for syntax highlighting**  
  Implemented using JavaScript RegExp instead of a full parsing library.
  Fragment shaders are short, so this approach is sufficient and avoids additional complexity.

- **Custom UI components**  
  All components (editor, resizable panels, tabs) are implemented from scratch.
  This provides full control over behavior and simplifies integration of new features.

## Challenges

- Unified an imperative WebGL render loop with React’s declarative model while keeping state and lifecycle consistent with React idioms
- Implemented inline error indicators in the code editor while preserving click-through interaction to the underlying textarea for uninterrupted editing

## Limitations and Future Work

- No support for multiple render passes
- No support for custom texture inputs. 

Both features require refactoring the rendering pipeline to support more general handling of render inputs and render targets.