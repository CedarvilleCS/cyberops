# The Admin Page

The admin page allows the researcher to setup the game script for an experiment
with research subjects

A *script* is simply a sequence of events which occur
to the user - no matter what actions the user takes, the script proceeds along
the steps. A *stage* is one step in the script; stages may make some actions
available to the user, or it may send them a notification, or it may change the
network that the user sees.

The notion of stages in a Cyber Kill Chain is integrated into scripts. Each
stage is assigned a particular step in the chain that it is associated with.
This association does nothing to restrict how the stage may be created, but it
will be presented to the user so that they know what kind of progress they are
making. In addition, each action is associated with a step in the chain so that
users may be able to tell which actions are pertinant to the stage they are at.

The admin page must provide the functionality to create stages, and items in
the stages.

Probably the most complex part of the admin page is the functionality to update
the state of the network as the script progresses. Each stages contains a
"diff" from the previous stage; that is, any updates to machines or network
topology will be in the stage, but things that have not changed will be
excluded. The diff approach is used because it would be annoying to have to
remake the network state at every stage. In order to keep the researcher from
losing context, the UI will walk through each step to show them what the state
of the network will be.

## Script

- [X] Create new stage and remove stages
- [X] Change stages kill chain step
- [X] Create new message and remove messages
- [X] Create new action and remove actions
- [X] Assign kill chain step to action
- [ ] Add diff items and remove diff items
- [ ] Find javascript computer network visualizer
