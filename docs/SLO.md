# Service Level Objectives (SLOs)

## Availability
- **Frontend**: 99.95% monthly uptime
- **Backend (Edge Functions)**: 99.9% availability
- **Database**: 99.95% availability (managed by Supabase)

## Performance
- **Route TTI (Time to Interactive)**: p95 < 2.5s
- **Overlay Load**: p95 < 300ms from query parameter
- **API Response Time**: p95 < 500ms for read operations, p95 < 1s for writes
- **Chat Response**: p95 < 3s for standard queries

## Errors
- **Client-side Error Rate**: < 0.1% of page views
- **API Error Rate**: < 0.5% of requests
- **DLQ (Dead Letter Queue)**: < 0.5% of jobs per day
- **Circuit Breaker Trips**: < 2 per day under normal load

## Accessibility
- **Axe Violations**: 0 critical or serious violations
- **Keyboard Navigation**: 100% of interactive elements accessible
- **Screen Reader Compatibility**: All core flows tested monthly

## AI/ML Systems
- **Model Availability**: 99.5% (with fallbacks)
- **Response Accuracy**: User satisfaction rating ≥ 4.0/5.0
- **Budget Adherence**: < 105% of allocated monthly budget

## Error Budget Policy

When any SLO is violated in the last 7 days:
1. **Feature Freeze**: No new features merged to main
2. **Reliability Focus**: All engineering effort directed to reliability improvements
3. **Incident Review**: Post-mortem within 48 hours
4. **Gradual Resume**: Resume features only after 3 consecutive days within SLO

## Monitoring & Alerting

- Health checks every 60s
- Incidents auto-created when SLO breached
- PagerDuty alerts for critical violations
- Weekly SLO review in team sync

## Review Cadence

- **Weekly**: Review trends, near-misses
- **Monthly**: Adjust SLO targets based on user needs
- **Quarterly**: Full system reliability review
