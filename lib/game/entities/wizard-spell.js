ig.module(
	'game.entities.wizard-spell'
)
.requires(
	'impact.entity',
    'impact.entity-pool'
)
.defines(function() {
    EntityWizardSpell = ig.Entity.extend({
        
        size: {x: 5, y: 5},
        offset: {x: 2, y: 2},
        maxVel: {x: 200, y: 200},
        flip: false,
        speed: 160,
        gravityFactor: 0,
        animSheet: new ig.AnimationSheet( 'media/wizard-spell.png', 9, 9 ),
        
        decayTime: 2.0,
        timerDecay: new ig.Timer( 0 ),
        
        type: ig.Entity.TYPE.B, // add to enemy group
        checkAgainst: ig.Entity.TYPE.A, // check collisions against friendly group
        collides: ig.Entity.COLLIDES.NONE,
        _wmIgnore: true,
        
        init: function( x, y, settings ) {
            this.parent( x, y, settings );
            this.prepareEntity();
            
            // add the animations
            this.addAnim( 'idle', 0.2, [0, 1, 2] );
        },
        
        // resurrect this entity from the entity pool (pooling enabled below)
        reset: function( x, y, settings ) {
            this.parent( x, y, settings );
            this.prepareEntity();
        },
              
        // reset parameters
        prepareEntity: function() {
             
            if ( this.animSheet === null ) {
                this.kill();
            }
            
            // reset parameters
            this.timerDecay = new ig.Timer( this.decayTime );
            
            // set destination
            this.setDestination();
        },
        
        // set destination
        setDestination: function() {
            if ( ig.game.player ) {
                
                // get angle from entity to player in radians
                var mx = ( ig.game.player.pos.x + ( ig.game.player.size.x / 2 ) );
                //var my = ( ig.game.player.pos.y + ( ig.game.player.size.y / 2 ) );
                var my = ig.game.player.pos.y;
                var radians =  Math.atan2(
                    ( my - this.pos.y ),
                    ( mx - this.pos.x )
                );
                
                // use angle to determine velocity
                var xVel = ( Math.cos( radians ) * this.speed );
                var yVel = ( Math.sin( radians ) * this.speed );
                this.maxVel.x = this.vel.x = this.accel.x = xVel;
                this.maxVel.y = this.vel.y = this.accel.y = yVel;
            }
        },
        
        update: function() {
        
            if ( ig.game.isPaused ) {
                return;
            }
            
            this.checkStatus();
            this.parent();
        },
        
        checkStatus: function() {
            
            // if decayed
            if ( this.timerDecay.delta() > 0 ) {
                this.kill();
            }
        },
        
        // opt out of collision
        handleMovementTrace: function( res ) {
            var mx = ( this.vel.x * ig.system.tick );
            var my = ( this.vel.y * ig.system.tick );
            this.pos.x += mx;
            this.pos.y += my;
        },
        
        // called during a .checkAgainst collision
        check: function( other ) {
            if ( other.receiveDamage( 1, this ) ) {
                this.kill();
            }
        },
        
        // called by other entity during a .checkAgainst collision
        receiveDamage: function( amount, from ) {
            this.kill();
            return true;
        },
        
    });
    
    ig.EntityPool.enableFor( EntityWizardSpell );
});