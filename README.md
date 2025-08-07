# Cycles
Body awareness, elevated.
## Screenshots
![screenshot 1](https://i.imgur.com/AXHhjtP.png)
![screenshot 2](https://i.imgur.com/XxXI7qm.png)
![screenshot 3](https://i.imgur.com/lQQNRVj.png)
## Algorithms
For finding positive and negative trends, Cycles checks for monotonicity in data and chooses the most dominant tonicity (positive, negative, stable).  
For making future predictions, Cycles uses an autoregressive multivariate linear regression model.  
## Tech Stack
Cycles is a Progressive Web App built on a from-scratch HTML/JS/CSS code base.  
### Custom Tooling
I built a custom matrix class for my uses here, as well as the entire pipeline for the regression model, the tonicity analysis, and the logging.

I also built out a bare bones bar-chart component, but it remains entirely minimal and really only applies to this project.