import { scan, mergeMap, shareReplay } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';

import { createAction } from './createAction';
import { Action, Reducer, Store, Effect, witness } from '../types';

export function createStore<A extends Action, S>(
    rootReducer: Reducer<A, S>,
    rootEffect?: Effect<A, S>,
): Store<A, S> {
    // setup store and reducers
    const action$ = new BehaviorSubject<A>(createAction('@@INIT') as A);

    const state$ = action$.pipe(
        scan(
            (prevState, action) => rootReducer(prevState, action),
            rootReducer(witness<S>(), createAction('@@INIT/state') as A),
        ),
        shareReplay(1),
    );

    // setup effects pipeline
    const effect$ = new Subject<Effect<A, S>>();

    effect$
        .pipe(mergeMap(effect => effect(action$, state$)))
        .subscribe(action => action$.next(action));

    if (rootEffect) {
        effect$.next(rootEffect);
    }

    return {
        action$,
        state$,
        effect$,
    };
}
