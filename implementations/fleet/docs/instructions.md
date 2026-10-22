1. Choose git repo mode. 
   2. for the UAT test we're using worktree mode, which is the default
2. Decided where the canonincal branch lives
   3. for the UAT test, it is the fleet_uat_test branch which lives in IdeaProjects/konspekt
4. In that branch, create fleet configuration
   5. which is fleet.json 
   5. this needs to go under ./konspekt/fleet/config directory
      6. this a noteworhty and needs to become a part of fleet design spec
6. Configure
   7. Noteworhy: we're deciding here that fleet config is the primary driver for the number/types of agents and 
      worktree directory setup
      8. add a task to in the future fit the pre-existing worktree/agent setup into konspekt fleet config
   9. Define the number and type of agents
   10. for each - worktree directory
11. Use default permission
12. run a script to set things up
    11. create directories with konspekt enabled for each agent
    12. make sure under ./konspekt there a config for this specific agent (e.g., spec writer agent needs to read 
        fleet spec writing skill
13. execute a script to start committer agent CLI